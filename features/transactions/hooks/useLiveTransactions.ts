"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TransactionSchema,
  type Transaction,
} from "@/lib/validators/fraud";

const STREAM_ENDPOINT = "/api/transactions/sse";
const MAX_CLIENT_TRANSACTIONS = 500;

export type StreamStatus = "connecting" | "connected" | "disconnected";

export function useLiveTransactions(initialTransactions: Transaction[]) {
  const [streamedTransactions, setStreamedTransactions] = useState<Transaction[]>(
    [],
  );
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("connecting");

  const transactions = useMemo(
    () => mergeSnapshots(streamedTransactions, initialTransactions),
    [streamedTransactions, initialTransactions],
  );

  useEffect(() => {
    const eventSource = new EventSource(STREAM_ENDPOINT);

    eventSource.onopen = () => setStreamStatus("connected");
    eventSource.onerror = () => setStreamStatus("disconnected");

    const handleTransaction = (event: Event) => {
      const message = event as MessageEvent<string>;
      try {
        const payload = JSON.parse(message.data);
        const parsed = TransactionSchema.safeParse(payload);
        if (!parsed.success) {
          console.warn("🚨 [Realtime SSE] Giao dịch từ Redis bị chạm màng lọc Zod Schema (Nên không thể Render UI):", parsed.error.issues);
          return;
        }

        console.log("🟢 [Realtime SSE] Nhận thành công giao dịch mới từ Redis:", parsed.data.transaction_id);
        
        setStreamedTransactions((previous) =>
          upsertTransaction(previous, parsed.data),
        );
      } catch (error) {
        console.error("🚨 [Realtime SSE] Lỗi rác JSON từ Backend đẩy xuống:", error);
        // Keep stream alive even if one event has malformed JSON.
      }
    };

    eventSource.addEventListener("transaction", handleTransaction as EventListener);

    return () => {
      eventSource.removeEventListener(
        "transaction",
        handleTransaction as EventListener,
      );
      eventSource.close();
    };
  }, []);

  return { transactions, streamStatus };
}

function upsertTransaction(
  previous: Transaction[],
  incoming: Transaction,
): Transaction[] {
  const withoutDuplicate = previous.filter(
    (item) => item.transaction_id !== incoming.transaction_id,
  );
  const merged = [incoming, ...withoutDuplicate];
  return sortTransactionsDesc(merged).slice(0, MAX_CLIENT_TRANSACTIONS);
}

function mergeSnapshots(
  streamed: Transaction[],
  snapshot: Transaction[],
): Transaction[] {
  const byId = new Map<string, Transaction>();

  for (const transaction of snapshot) {
    byId.set(transaction.transaction_id, transaction);
  }

  for (const transaction of streamed) {
    byId.set(transaction.transaction_id, transaction);
  }

  return sortTransactionsDesc(Array.from(byId.values())).slice(
    0,
    MAX_CLIENT_TRANSACTIONS,
  );
}

function sortTransactionsDesc(items: Transaction[]): Transaction[] {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.timestamp);
    const rightTime = Date.parse(right.timestamp);

    const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
    return safeRight - safeLeft;
  });
}
