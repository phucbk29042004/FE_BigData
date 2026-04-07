import { TransactionSchema, type Transaction } from "@/lib/validators/fraud";

export type TransactionStreamConfig = {
  restUrl: string;
  restToken: string;
  streamKey: string;
  blockMs: number;
  readCount: number;
};

export type StreamTransactionEvent = {
  id: string;
  transaction: Transaction;
};

type StreamRecord = {
  id: string;
  fields: Record<string, string>;
};

const DEFAULT_STREAM_KEY = "fraud:tx:stream";
const DEFAULT_BLOCK_MS = 15_000;
const DEFAULT_READ_COUNT = 20;
const DEFAULT_SNAPSHOT_LIMIT = 300;
const DEFAULT_SCAN_COUNT = 200;
const DEFAULT_KV_PATTERNS = [
  "alert:fraud:*",
  "TXN-*",
  "tx:*",
  "transaction:*",
];
const DEFAULT_JSON_KEYS = [
  "fraud:transactions",
  "transactions",
  "tx:list",
];
const DEFAULT_LIST_KEYS = ["fraud_queue"];

export function resolveTransactionStreamConfig(): TransactionStreamConfig | null {
  const restUrl = getFirstEnv("UPSTASH_REDIS_REST_URL");
  const restToken = getFirstEnv("UPSTASH_REDIS_REST_TOKEN");

  let parsedConnection: { restUrl: string; restToken: string } | null = null;
  if (!restUrl || !restToken) {
    const connectionValue = getFirstEnv("UPSTASH_REDIS_CONNECTION");
    if (connectionValue) {
      parsedConnection = parseInlineUpstashConnection(connectionValue);
    }
  }

  const finalRestUrl = normalizeRestUrl(restUrl ?? parsedConnection?.restUrl ?? "");
  const finalRestToken = restToken ?? parsedConnection?.restToken ?? "";

  if (!finalRestUrl || !finalRestToken) {
    return null;
  }

  return {
    restUrl: finalRestUrl,
    restToken: finalRestToken,
    streamKey: getFirstEnv("TRANSACTIONS_STREAM_KEY") ?? DEFAULT_STREAM_KEY,
    blockMs: parseNumberEnv(getFirstEnv("TRANSACTIONS_STREAM_BLOCK_MS"), DEFAULT_BLOCK_MS),
    readCount: parseNumberEnv(getFirstEnv("TRANSACTIONS_STREAM_READ_COUNT"), DEFAULT_READ_COUNT),
  };
}

export async function readTransactionEvents(
  config: TransactionStreamConfig,
  cursor: string,
): Promise<{ events: StreamTransactionEvent[]; nextCursor: string }> {
  const command = [
    "XREAD",
    "BLOCK",
    String(config.blockMs),
    "COUNT",
    String(config.readCount),
    "STREAMS",
    config.streamKey,
    cursor,
  ];

  const rawPayload = await executeUpstashCommand(config, command);
  const streamRecords = parseStreamRecords(rawPayload);
  const events: StreamTransactionEvent[] = [];
  let nextCursor = cursor;

  for (const streamRecord of streamRecords) {
    nextCursor = streamRecord.id;
    const mappedTransaction = mapRecordToTransaction(streamRecord.fields);
    if (!mappedTransaction) continue;
    events.push({ id: streamRecord.id, transaction: mappedTransaction });
  }

  return { events, nextCursor };
}

export async function readRecentTransactions(
  config: TransactionStreamConfig,
  limit = DEFAULT_SNAPSHOT_LIMIT,
): Promise<Transaction[]> {
  const safeLimit = clamp(limit, 1, 1000);

  const fromStream = await readSnapshotFromStream(config, safeLimit);
  if (fromStream.length > 0) {
    return fromStream;
  }

  const fromJsonKeys = await readSnapshotFromJsonKeys(config, safeLimit);
  if (fromJsonKeys.length > 0) {
    return fromJsonKeys;
  }

  const fromLists = await readSnapshotFromLists(config, safeLimit);
  if (fromLists.length > 0) {
    return fromLists;
  }

  return readSnapshotFromKv(config, safeLimit);
}

async function readSnapshotFromStream(
  config: TransactionStreamConfig,
  limit: number,
): Promise<Transaction[]> {
  try {
    const rawPayload = await executeUpstashCommand(config, [
      "XREVRANGE",
      config.streamKey,
      "+",
      "-",
      "COUNT",
      String(limit),
    ]);

    const streamRecords = parseEntries(extractCommandResult(rawPayload));
    const transactions = streamRecords
      .map((record) => mapRecordToTransaction(record.fields))
      .filter((transaction): transaction is Transaction => Boolean(transaction));

    return finalizeTransactions(transactions, limit);
  } catch (error) {
    console.warn("[transactions-stream] Failed to read stream snapshot", {
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function readSnapshotFromJsonKeys(
  config: TransactionStreamConfig,
  limit: number,
): Promise<Transaction[]> {
  const jsonKeys = parseListEnv(
    getFirstEnv("TRANSACTIONS_JSON_KEYS"),
    DEFAULT_JSON_KEYS,
  );

  for (const key of jsonKeys) {
    try {
      const rawPayload = await executeUpstashCommand(config, ["GET", key]);
      const candidateTransactions = normalizeTransactionsFromUnknown(
        extractCommandResult(rawPayload),
      );
      if (candidateTransactions.length > 0) {
        return finalizeTransactions(candidateTransactions, limit);
      }
    } catch (error) {
      console.warn("[transactions-stream] Failed to read JSON key", {
        key,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return [];
}

async function readSnapshotFromLists(
  config: TransactionStreamConfig,
  limit: number,
): Promise<Transaction[]> {
  const listKeys = parseListEnv(
    getFirstEnv("TRANSACTIONS_LIST_KEYS"),
    DEFAULT_LIST_KEYS,
  );

  for (const key of listKeys) {
    try {
      const rawPayload = await executeUpstashCommand(config, [
        "LRANGE",
        key,
        "0",
        String(Math.max(0, limit - 1)),
      ]);

      const listEntries = extractCommandResult(rawPayload);
      if (!Array.isArray(listEntries)) continue;

      const transactions = listEntries
        .map((item) => mapUnknownToTransaction(item))
        .filter((transaction): transaction is Transaction => Boolean(transaction));

      if (transactions.length > 0) {
        return finalizeTransactions(transactions, limit);
      }
    } catch (error) {
      console.warn("[transactions-stream] Failed to read list key", {
        key,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return [];
}

async function readSnapshotFromKv(
  config: TransactionStreamConfig,
  limit: number,
): Promise<Transaction[]> {
  const patterns = parseListEnv(
    getFirstEnv("TRANSACTIONS_KV_PATTERNS"),
    DEFAULT_KV_PATTERNS,
  );

  for (const pattern of patterns) {
    const keys = await scanKeys(config, pattern, limit * 2);
    if (keys.length === 0) continue;

    const fromValues = await readTransactionsFromValues(config, keys, limit);
    if (fromValues.length > 0) {
      return fromValues;
    }

    const fromHashes = await readTransactionsFromHashes(config, keys, limit);
    if (fromHashes.length > 0) {
      return fromHashes;
    }
  }

  return [];
}

async function scanKeys(
  config: TransactionStreamConfig,
  pattern: string,
  maxKeys: number,
): Promise<string[]> {
  let cursor = "0";
  let attempts = 0;
  const found: string[] = [];
  const scanCount = parseNumberEnv(
    getFirstEnv("TRANSACTIONS_SCAN_COUNT"),
    DEFAULT_SCAN_COUNT,
  );

  do {
    const rawPayload = await executeUpstashCommand(config, [
      "SCAN",
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      String(scanCount),
    ]);

    const { nextCursor, keys } = parseScanResult(rawPayload);
    cursor = nextCursor;

    for (const key of keys) {
      if (found.length >= maxKeys) break;
      if (!found.includes(key)) {
        found.push(key);
      }
    }

    attempts += 1;
  } while (cursor !== "0" && found.length < maxKeys && attempts < 20);

  return found;
}

function parseScanResult(payload: unknown): {
  nextCursor: string;
  keys: string[];
} {
  const result = extractCommandResult(payload);
  if (!Array.isArray(result)) {
    return { nextCursor: "0", keys: [] };
  }

  const nextCursor = String(result[0] ?? "0");
  const rawKeys = Array.isArray(result[1]) ? result[1] : [];
  const keys = rawKeys
    .map((item) => (typeof item === "string" ? item : ""))
    .filter(Boolean);

  return { nextCursor, keys };
}

async function readTransactionsFromValues(
  config: TransactionStreamConfig,
  keys: string[],
  limit: number,
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  for (const chunk of chunkList(keys, 80)) {
    const rawPayload = await executeUpstashCommand(config, ["MGET", ...chunk]);
    const results = extractCommandResult(rawPayload);
    if (!Array.isArray(results)) continue;

    for (const value of results) {
      const mapped = mapUnknownToTransaction(value);
      if (mapped) {
        transactions.push(mapped);
      }
    }

    if (transactions.length >= limit) break;
  }

  return finalizeTransactions(transactions, limit);
}

async function readTransactionsFromHashes(
  config: TransactionStreamConfig,
  keys: string[],
  limit: number,
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  for (const chunk of chunkList(keys, 30)) {
    const commands = chunk.map((key) => ["HGETALL", key]);
    const rawPayload = await executeUpstashPipeline(config, commands);

    for (const result of parsePipelineResults(rawPayload)) {
      const fields = parseFieldPairs(result);
      if (Object.keys(fields).length === 0) continue;

      const mapped = mapRecordToTransaction(fields);
      if (mapped) {
        transactions.push(mapped);
      }
    }

    if (transactions.length >= limit) break;
  }

  return finalizeTransactions(transactions, limit);
}

function parsePipelineResults(payload: unknown): unknown[] {
  if (!Array.isArray(payload)) {
    const extracted = extractCommandResult(payload);
    return Array.isArray(extracted) ? extracted : [];
  }

  return payload.map((item) => extractCommandResult(item));
}

function normalizeTransactionsFromUnknown(payload: unknown): Transaction[] {
  const candidate = tryParseJson(payload);

  if (Array.isArray(candidate)) {
    return candidate
      .map((item) => mapUnknownToTransaction(item))
      .filter((transaction): transaction is Transaction => Boolean(transaction));
  }

  if (isRecord(candidate)) {
    const containers = [
      candidate.transactions,
      candidate.items,
      candidate.rows,
      candidate.data,
      candidate.result,
    ];

    for (const container of containers) {
      if (Array.isArray(container)) {
        return container
          .map((item) => mapUnknownToTransaction(item))
          .filter((transaction): transaction is Transaction => Boolean(transaction));
      }
    }

    const mappedSingle = mapUnknownToTransaction(candidate);
    return mappedSingle ? [mappedSingle] : [];
  }

  return [];
}

function mapUnknownToTransaction(payload: unknown): Transaction | null {
  const parsedPayload = tryParseJson(payload);
  if (!isRecord(parsedPayload)) return null;

  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsedPayload)) {
    fields[key] = stringifyValue(value);
  }

  return mapRecordToTransaction(fields);
}

function finalizeTransactions(
  transactions: Transaction[],
  limit: number,
): Transaction[] {
  const byId = new Map<string, Transaction>();
  for (const transaction of transactions) {
    byId.set(transaction.transaction_id, transaction);
  }

  return [...byId.values()]
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, limit);
}

function parseListEnv(rawValue: string | undefined, fallback: string[]): string[] {
  if (!rawValue) return fallback;

  const items = rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

function chunkList<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

async function executeUpstashCommand(
  config: TransactionStreamConfig,
  command: string[],
): Promise<unknown> {
  const headers = {
    Authorization: `Bearer ${config.restToken}`,
    "Content-Type": "application/json",
  };

  const directResponse = await fetch(config.restUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (directResponse.ok) {
    return parseResponseBody(directResponse);
  }

  const pipelineResponse = await fetch(`${config.restUrl}/pipeline`, {
    method: "POST",
    headers,
    body: JSON.stringify([command]),
    cache: "no-store",
  });

  if (pipelineResponse.ok) {
    return parseResponseBody(pipelineResponse);
  }

  const directError = await parseResponseBody(directResponse);
  const pipelineError = await parseResponseBody(pipelineResponse);
  throw new Error(
    `[transactions-stream] Redis command failed. Direct=${directResponse.status} ${JSON.stringify(directError)} | Pipeline=${pipelineResponse.status} ${JSON.stringify(pipelineError)}`,
  );
}

async function executeUpstashPipeline(
  config: TransactionStreamConfig,
  commands: string[][],
): Promise<unknown> {
  const response = await fetch(`${config.restUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.restToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (response.ok) {
    return parseResponseBody(response);
  }

  const errorPayload = await parseResponseBody(response);
  throw new Error(
    `[transactions-stream] Redis pipeline failed. Status=${response.status} Payload=${JSON.stringify(errorPayload)}`,
  );
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const rawText = await response.text();
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function parseStreamRecords(payload: unknown): StreamRecord[] {
  const result = extractCommandResult(payload);
  if (!Array.isArray(result)) return [];

  const records: StreamRecord[] = [];
  for (const streamChunk of result) {
    if (Array.isArray(streamChunk)) {
      const entries = parseEntries(streamChunk[1]);
      records.push(...entries);
      continue;
    }

    if (isRecord(streamChunk)) {
      const entries = parseEntries(streamChunk.messages ?? streamChunk.entries);
      records.push(...entries);
    }
  }
  return records;
}

function parseEntries(rawEntries: unknown): StreamRecord[] {
  if (!Array.isArray(rawEntries)) return [];

  const records: StreamRecord[] = [];
  for (const entry of rawEntries) {
    if (Array.isArray(entry)) {
      const streamId = String(entry[0] ?? "");
      if (!streamId) continue;
      records.push({ id: streamId, fields: parseFieldPairs(entry[1]) });
      continue;
    }

    if (isRecord(entry)) {
      const streamId = typeof entry.id === "string" ? entry.id : "";
      if (!streamId) continue;
      records.push({
        id: streamId,
        fields: parseFieldPairs(entry.fields ?? entry.value),
      });
    }
  }
  return records;
}

function parseFieldPairs(rawFields: unknown): Record<string, string> {
  const parsed: Record<string, string> = {};

  if (Array.isArray(rawFields)) {
    for (let index = 0; index < rawFields.length; index += 2) {
      const key = String(rawFields[index] ?? "");
      if (!key) continue;
      parsed[key] = stringifyValue(rawFields[index + 1]);
    }
    return parsed;
  }

  if (isRecord(rawFields)) {
    for (const [key, value] of Object.entries(rawFields)) {
      parsed[key] = stringifyValue(value);
    }
  }

  return parsed;
}

function mapRecordToTransaction(rawFields: Record<string, string>): Transaction | null {
  const payload = normalizePayload(rawFields);
  const transactionId = pickString(payload, "transaction_id");
  const senderId = pickString(payload, "sender_id");
  const receiverId = pickString(payload, "receiver_id");
  const timestamp = parseTimestamp(payload.timestamp);
  const amount = toFiniteNumber(payload.amount);

  if (!transactionId || !senderId || !receiverId || !timestamp || amount === undefined || amount <= 0) {
    return null;
  }

  const normalizedFraudType = parseFraudType(payload.fraud_type);
  const directFraudFlag = parseBinaryFlag(payload.is_fraud ?? payload.prediction);
  const probabilityScore = parsePredictionScore(
    payload.probability ?? payload.fraud_probability ?? payload.prediction,
  );
  const inferredFraudFlag: 0 | 1 =
    directFraudFlag ??
    (probabilityScore !== undefined
      ? probabilityScore >= 0.5
        ? 1
        : 0
      : normalizedFraudType
        ? 1
        : 0);

  const oldBalance = toNonNegativeNumber(payload.old_balance_sender) ?? 0;
  const newBalance =
    toNonNegativeNumber(payload.new_balance_sender) ?? Math.max(0, oldBalance - amount);

  const normalizedProbability =
    probabilityScore !== undefined && probabilityScore >= 0 && probabilityScore <= 1
      ? probabilityScore
      : undefined;
  const normalizedHour = parseHour(payload.hour, timestamp);
  const blacklistFlag = parseBinaryFlag(payload.is_in_blacklist);

  const candidate = {
    transaction_id: transactionId,
    timestamp,
    sender_id: senderId,
    receiver_id: receiverId,
    type: normalizeTxType(payload.type),
    amount,
    old_balance_sender: oldBalance,
    new_balance_sender: newBalance,
    device_id: pickString(payload, "device_id") ?? "UNKNOWN_DEVICE",
    location: pickString(payload, "location") ?? "Unknown",
    ip_address: pickString(payload, "ip_address") ?? "0.0.0.0",
    is_fraud: inferredFraudFlag,
    fraud_type: normalizedFraudType,
    fraud_probability: normalizedProbability,
    hour: normalizedHour,
    is_in_blacklist: blacklistFlag,
  } satisfies Transaction;

  const parsedTransaction = TransactionSchema.safeParse(candidate);
  if (!parsedTransaction.success) {
    console.warn("[transactions-stream] Skipped invalid transaction payload", {
      transaction_id: transactionId,
      issues: parsedTransaction.error.issues.map((issue) => issue.message),
    });
    return null;
  }

  return parsedTransaction.data;
}

function normalizePayload(rawFields: Record<string, string>): Record<string, unknown> {
  const maybeJsonPayload = rawFields.payload ?? rawFields.data ?? rawFields.transaction;
  const parsedPayload = tryParseJson(maybeJsonPayload);

  if (isRecord(parsedPayload)) {
    return { ...rawFields, ...parsedPayload };
  }

  return rawFields;
}

function pickString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function parseTimestamp(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.valueOf()) ? undefined : parsedDate.toISOString();
  }

  if (typeof value !== "string") return undefined;
  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;

  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.valueOf()) ? undefined : trimmedValue;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toNonNegativeNumber(value: unknown): number | undefined {
  const parsed = toFiniteNumber(value);
  if (parsed === undefined) return undefined;
  return parsed < 0 ? 0 : parsed;
}

function parseFraudType(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (lowered === "null" || lowered === "none" || lowered === "nan") return null;
  return raw;
}

function normalizeTxType(value: unknown): Transaction["type"] {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (normalized === "PAYMENT" || normalized === "TRANSFER" || normalized === "CASH_OUT") {
    return normalized;
  }
  if (normalized === "WITHDRAWAL") return "CASH_OUT";
  if (normalized === "DEPOSIT") return "PAYMENT";
  return "TRANSFER";
}

function parseBinaryFlag(value: unknown): 0 | 1 | undefined {
  if (typeof value === "number") {
    if (value === 0) return 0;
    if (value === 1) return 1;
    return undefined;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;

  if (normalized === "1" || normalized === "true" || normalized === "yes") return 1;
  if (normalized === "0" || normalized === "false" || normalized === "no") return 0;
  return undefined;
}

function parseHour(value: unknown, timestamp: string): number | undefined {
  const parsed = toFiniteNumber(value);
  if (parsed !== undefined) {
    const normalized = Math.floor(parsed);
    if (normalized >= 0 && normalized <= 23) {
      return normalized;
    }
  }

  const fromTimestamp = new Date(timestamp).getUTCHours();
  if (!Number.isNaN(fromTimestamp) && fromTimestamp >= 0 && fromTimestamp <= 23) {
    return fromTimestamp;
  }

  return undefined;
}

function parsePredictionScore(value: unknown): number | undefined {
  const parsedValue = tryParseJson(value);
  if (parsedValue === undefined || parsedValue === null) return undefined;

  if (typeof parsedValue === "number" && Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  if (typeof parsedValue === "string") {
    const fromString = Number(parsedValue.trim());
    return Number.isFinite(fromString) ? fromString : undefined;
  }

  if (Array.isArray(parsedValue) && parsedValue.length > 1) {
    return toFiniteNumber(parsedValue[1]);
  }

  if (isRecord(parsedValue)) {
    const fromValues = Array.isArray(parsedValue.values) ? toFiniteNumber(parsedValue.values[1]) : undefined;
    if (fromValues !== undefined) return fromValues;

    const directProbability = toFiniteNumber(
      parsedValue.fraud_probability ?? parsedValue.probability ?? parsedValue.score,
    );
    if (directProbability !== undefined) return directProbability;
  }

  return undefined;
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function extractCommandResult(payload: unknown): unknown {
  if (Array.isArray(payload) && payload.length > 0) {
    const firstItem = payload[0];
    if (isRecord(firstItem) && "result" in firstItem) {
      return firstItem.result;
    }
  }

  if (isRecord(payload) && "result" in payload) {
    return payload.result;
  }

  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getFirstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function parseNumberEnv(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseInlineUpstashConnection(rawValue: string): { restUrl: string; restToken: string } | null {
  const segments = rawValue.split(",").map((segment) => segment.trim()).filter(Boolean);
  if (segments.length === 0) return null;

  const hostSegment = segments[0];
  const host = hostSegment.split(":")[0]?.trim();
  const passwordSegment = segments.find((segment) => segment.toLowerCase().startsWith("password="));
  const token = passwordSegment?.slice("password=".length).trim();

  if (!host || !token) return null;
  return {
    restUrl: `https://${host}`,
    restToken: token,
  };
}

function normalizeRestUrl(value: string): string {
  return value.replace(/\/+$/, "");
}








