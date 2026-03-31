"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type Transaction } from "@/lib/validators/fraud";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 8;

const FRAUD_TYPE_COLORS: Record<string, string> = {
  "Blacklist Receiver": "bg-rose/10 text-rose border-rose/20",
  "Blacklist Sender": "bg-rose/10 text-rose border-rose/20",
  "Blacklist Involved": "bg-rose/10 text-rose border-rose/20",
  "High Amount Transfer": "bg-amber/10 text-amber border-amber/20",
  "Location Anomaly": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Velocity Attack": "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const TX_TYPE_LABELS: Record<string, string> = {
  TRANSFER: "Chuyển tiền",
  PAYMENT: "Thanh toán",
  DEPOSIT: "Nạp tiền",
  WITHDRAWAL: "Rút tiền",
};

const TX_TYPE_COLORS: Record<string, string> = {
  TRANSFER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PAYMENT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  DEPOSIT: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  WITHDRAWAL: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const currentPage = Number(params.get("page") ?? 1);
  const fraudFilter = params.get("fraud");

  const filtered =
    fraudFilter === "1"
      ? transactions.filter((t) => t.is_fraud === 1)
      : fraudFilter === "0"
        ? transactions.filter((t) => t.is_fraud === 0)
        : transactions;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.set("page", "1");
    // Sử dụng { scroll: false } để Next.js không tự động cuộn lên đầu trang khi update URL
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl border border-border-default shadow-cinematic overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-inner-glow" />
      
      {/* Toolbar */}
      <div className="px-6 py-5 border-b border-border-default/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-600 text-foreground tracking-tight">
            Lịch sử Giao dịch
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            {filtered.length} bản ghi
          </p>
        </div>
        
        <div className="flex gap-1.5 p-1 bg-surface border border-border-default rounded-lg">
          <FilterBtn
            active={!fraudFilter}
            onClick={() => setParam("fraud", null)}
            label="Tất cả"
          />
          <FilterBtn
            active={fraudFilter === "1"}
            onClick={() => setParam("fraud", "1")}
            label="Cảnh báo"
            activeclassName="bg-surface hover:bg-surface text-rose border border-rose/20 shadow-[0_0_8px_rgba(225,29,72,0.15)]"
          />
          <FilterBtn
            active={fraudFilter === "0"}
            onClick={() => setParam("fraud", "0")}
            label="An toàn"
            activeclassName="bg-surface hover:bg-surface text-emerald border border-emerald/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default/40 bg-white/[0.01]">
              {["Mã GD", "Thời gian", "Người Gửi", "Người Nhận", "Loại", "Số tiền (₫)", "Thiết bị", "Trạng thái"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[10px] font-mono tracking-widest uppercase text-foreground-subtle"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/30">
            {paginated.map((tx) => (
              <tr
                key={tx.transaction_id}
                className={cn(
                  "group transition-colors duration-200 hover:bg-surface-hover",
                  tx.is_fraud === 1 && "bg-rose/5 hover:bg-rose/10 pointer-events-auto"
                )}
              >
                <td className="px-5 py-4 font-mono text-xs text-foreground mr-1">
                  {tx.transaction_id}
                </td>
                <td className="px-5 py-4 text-foreground-muted whitespace-nowrap text-[11px] font-mono">
                  {new Date(tx.timestamp).toLocaleString("en-US", {
                    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short"
                  })}
                </td>
                <td className="px-5 py-4 font-mono text-[11px] text-foreground-subtle">{tx.sender_id}</td>
                <td className="px-5 py-4 font-mono text-[11px] text-foreground-subtle">{tx.receiver_id}</td>
                <td className="px-5 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border whitespace-nowrap",
                    TX_TYPE_COLORS[tx.type] ?? "bg-surface border-border-default text-foreground-muted"
                  )}>
                    {TX_TYPE_LABELS[tx.type] ?? tx.type}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono font-500 text-foreground whitespace-nowrap text-xs">
                  {tx.amount.toLocaleString("vi-VN")} ₫
                </td>
                <td className="px-5 py-4 text-foreground-subtle text-[11px] font-mono">{tx.device_id.slice(0, 10)}...</td>
                <td className="px-5 py-4">
                  {tx.is_fraud === 1 ? (
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="flex items-center gap-1.5 text-rose font-500 text-xs">
                        <AlertTriangle size={12} /> Nguy hiểm
                      </span>
                      {tx.fraud_type && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded border text-[10px] font-mono tracking-wider",
                            FRAUD_TYPE_COLORS[tx.fraud_type] ?? "bg-surface border-border-default text-foreground-muted"
                          )}
                        >
                          {tx.fraud_type}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald font-500 text-xs">
                      <CheckCircle size={12} /> An toàn
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-border-default/40 bg-white/[0.01] flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-subtle">
          Trang {safePage} / {totalPages}
        </p>
        <div className="flex gap-1.5">
          <PagingBtn
            disabled={safePage <= 1}
            onClick={() => setParam("page", String(safePage - 1))}
          >
            <ChevronLeft size={14} />
          </PagingBtn>
          <PagingBtn
            disabled={safePage >= totalPages}
            onClick={() => setParam("page", String(safePage + 1))}
          >
            <ChevronRight size={14} />
          </PagingBtn>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  label,
  activeclassName = "bg-[#5E6AD2] hover:bg-[#5E6AD2] text-white shadow-cta-glow border border-accent",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeclassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-widest transition-all duration-200 border border-transparent",
        active ? activeclassName : "text-foreground-muted hover:bg-white/[0.02]"
      )}
    >
      {label}
    </button>
  );
}

function PagingBtn({ disabled, children, ...props }: any) {
  return (
    <button
      disabled={disabled}
      {...props}
      className={cn(
        "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 border",
        disabled
          ? "border-transparent text-foreground-subtle/30 cursor-not-allowed"
          : "bg-surface border-border-default text-foreground-muted hover:border-border-hover hover:text-foreground hover:bg-surface-hover"
      )}
    >
      {children}
    </button>
  );
}
