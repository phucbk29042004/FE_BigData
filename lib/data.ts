import fs from "fs";
import path from "path";
import {
  TransactionListSchema,
  BlacklistSchema,
  type Transaction,
  type BlacklistEntry,
} from "@/lib/validators/fraud";
import {
  readRecentTransactions,
  resolveTransactionStreamConfig,
} from "@/lib/realtime/transactions-stream";

// Duong dan toi file du lieu tinh
const DATA_DIR = path.join(process.cwd(), "data");
const REDIS_SNAPSHOT_LIMIT = 400;

/**
 * Doc va validate toan bo danh sach giao dich.
 * Thu tu uu tien:
 * 1) Redis (stream/json key/value) de hien thi du lieu moi nhat
 * 2) File JSON tinh khi Redis chua co data hop le
 */
export async function getTransactions(): Promise<Transaction[]> {
  const redisConfig = resolveTransactionStreamConfig();

  if (redisConfig) {
    try {
      const redisTransactions = await readRecentTransactions(
        redisConfig,
        REDIS_SNAPSHOT_LIMIT,
      );

      if (redisTransactions.length > 0) {
        return redisTransactions;
      }

      console.warn(
        "[getTransactions] Redis is configured but returned no valid transactions. Falling back to local file.",
      );
    } catch (error) {
      console.warn("[getTransactions] Redis read failed, fallback to local file.", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return readTransactionsFromFile();
}

function readTransactionsFromFile(): Transaction[] {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, "transactions.json"), "utf-8");
    const parsed = TransactionListSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.error("[getTransactions] Validation error:", parsed.error.flatten());
      return [];
    }
    return parsed.data;
  } catch (error) {
    console.error("[getTransactions] Failed to read local transactions file:", error);
    return [];
  }
}

/**
 * Doc va validate toan bo danh sach den tu file JSON tinh.
 * Server-only function.
 */
export async function getBlacklist(): Promise<BlacklistEntry[]> {
  const raw = fs.readFileSync(path.join(DATA_DIR, "blacklist.json"), "utf-8");
  const parsed = BlacklistSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error("[getBlacklist] Validation error:", parsed.error.flatten());
    return [];
  }
  return parsed.data;
}

/**
 * Tong hop thong ke gian lan cho Dashboard:
 * - Tong so giao dich, so gian lan, tong tien gian lan
 * - Ti le gian lan theo loai (FraudType distribution)
 */
export async function getFraudStats() {
  const transactions = await getTransactions();
  const fraudulent = transactions.filter((t) => t.is_fraud === 1);
  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);
  const fraudAmount = fraudulent.reduce((s, t) => s + t.amount, 0);

  // Tinh phan phoi loai gian lan
  const fraudTypeMap: Record<string, number> = {};
  for (const t of fraudulent) {
    if (t.fraud_type) {
      fraudTypeMap[t.fraud_type] = (fraudTypeMap[t.fraud_type] ?? 0) + 1;
    }
  }
  const fraudByType = Object.entries(fraudTypeMap).map(([name, count]) => ({
    name,
    count,
  }));

  // Ti le gian lan theo loai giao dich (PAYMENT, TRANSFER, CASH_OUT)
  const typeMap: Record<string, { total: number; fraud: number }> = {};
  for (const t of transactions) {
    if (!typeMap[t.type]) typeMap[t.type] = { total: 0, fraud: 0 };
    typeMap[t.type].total++;
    if (t.is_fraud === 1) typeMap[t.type].fraud++;
  }
  const fraudByTxType = Object.entries(typeMap).map(([type, stats]) => ({
    type,
    ...stats,
  }));

  return {
    totalTransactions: transactions.length,
    totalFraud: fraudulent.length,
    totalAmount,
    fraudAmount,
    fraudRate: fraudulent.length / transactions.length,
    fraudByType,
    fraudByTxType,
  };
}
