import fs from "fs";
import path from "path";
import {
  TransactionListSchema,
  BlacklistSchema,
  type Transaction,
  type BlacklistEntry,
} from "@/lib/validators/fraud";

// ─── Đường dẫn tới file dữ liệu tĩnh ────────────────────────────
const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Đọc và validate toàn bộ danh sách giao dịch từ file JSON tĩnh.
 * Server-only function – không gọi từ Client Component.
 */
export async function getTransactions(): Promise<Transaction[]> {
  const raw = fs.readFileSync(path.join(DATA_DIR, "transactions.json"), "utf-8");
  const parsed = TransactionListSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error("[getTransactions] Validation error:", parsed.error.flatten());
    return [];
  }
  return parsed.data;
}

/**
 * Đọc và validate toàn bộ danh sách đen từ file JSON tĩnh.
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
 * Tổng hợp thống kê gian lận cho Dashboard:
 * - Tổng số giao dịch, số gian lận, tổng tiền gian lận
 * - Tỉ lệ gian lận theo loại (FraudType distribution)
 */
export async function getFraudStats() {
  const transactions = await getTransactions();
  const fraudulent = transactions.filter((t) => t.is_fraud === 1);
  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);
  const fraudAmount = fraudulent.reduce((s, t) => s + t.amount, 0);

  // Tính phân phối loại gian lận
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

  // Tỉ lệ gian lận theo loại giao dịch (PAYMENT, TRANSFER, CASH_OUT)
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
