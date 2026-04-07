import { z } from "zod";

/**
 * Schema for a single financial transaction entry.
 * Source of truth for type safety across the entire dashboard.
 * Edge cases:
 * - fraud_type có thể là null khi giao dịch sạch (is_fraud = 0)
 * - amount luôn dương, đơn vị: VND
 */
export const TransactionSchema = z.object({
  transaction_id: z.string(),
  timestamp: z.string(),
  sender_id: z.string(),
  receiver_id: z.string(),
  type: z.enum(["PAYMENT", "TRANSFER", "CASH_OUT"]),
  amount: z.number().positive(),
  old_balance_sender: z.number().nonnegative(),
  new_balance_sender: z.number().nonnegative(),
  device_id: z.string(),
  location: z.string(),
  ip_address: z.string(),
  is_fraud: z.union([z.literal(0), z.literal(1)]),
  fraud_type: z.string().nullable(),
  fraud_probability: z.number().min(0).max(1).optional(),
  hour: z.number().int().min(0).max(23).optional(),
  is_in_blacklist: z.union([z.literal(0), z.literal(1)]).optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Schema cho một bản ghi trong danh sách đen.
 * Edge case: account_id prefix 'C' = khách hàng, 'M' = merchant.
 */
export const BlacklistEntrySchema = z.object({
  account_id: z.string(),
  reason: z.string().min(1),
  added_at: z.string(),
});

export type BlacklistEntry = z.infer<typeof BlacklistEntrySchema>;

export const TransactionListSchema = z.array(TransactionSchema);
export const BlacklistSchema = z.array(BlacklistEntrySchema);
