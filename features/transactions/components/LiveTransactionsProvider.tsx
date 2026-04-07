"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Transaction } from "@/lib/validators/fraud";
import { useLiveTransactions, type StreamStatus } from "@/features/transactions/hooks/useLiveTransactions";

interface LiveTransactionsContextValue {
  liveTransactions: Transaction[];
  streamStatus: StreamStatus;
}

const LiveTransactionsContext = createContext<LiveTransactionsContextValue | null>(null);

/**
 * LiveTransactionsProvider
 * 
 * Bọc quanh các component cần dữ liệu thời gian thực (như Bảng và Biểu đồ).
 * Đảm bảo hệ thống duy trì duy nhất 1 luồng kết nối SSE (EventSource) cho toàn màn hình, 
 * tránh việc mỗi component tự mở kết nối riêng gây quá tải tới Redis/Backend.
 */
export function LiveTransactionsProvider({
  initialTransactions,
  children,
}: {
  initialTransactions: Transaction[];
  children: ReactNode;
}) {
  const { transactions, streamStatus } = useLiveTransactions(initialTransactions);

  return (
    <LiveTransactionsContext.Provider value={{ liveTransactions: transactions, streamStatus }}>
      {children}
    </LiveTransactionsContext.Provider>
  );
}

/**
 * Hook truy xuất dữ liệu từ Live Stream an toàn
 */
export function useSharedLiveTransactions() {
  const context = useContext(LiveTransactionsContext);
  if (!context) {
    throw new Error("useSharedLiveTransactions phải được dùng bên trong LiveTransactionsProvider");
  }
  return context;
}
