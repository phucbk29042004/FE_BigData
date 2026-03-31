"use client";

import { useState, useOptimistic, useTransition } from "react";
import { type BlacklistEntry } from "@/lib/validators/fraud";
import { ShieldX, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  C: "bg-surface text-accent border-accent/20",
  M: "bg-surface text-emerald border-emerald/20",
};

interface BlacklistManagerProps {
  initialEntries: BlacklistEntry[];
}

export function BlacklistManager({ initialEntries }: BlacklistManagerProps) {
  const [showModal, setShowModal] = useState(false);
  // Optimistic update
  const [optimisticList, addOptimistic] = useOptimistic(
    initialEntries,
    (state, newEntry: BlacklistEntry) => [newEntry, ...state]
  );
  const [isPending, startTransition] = useTransition();

  function handleAdd(entry: BlacklistEntry) {
    startTransition(() => {
      addOptimistic(entry);
      setShowModal(false);
      // TODO: Server Action handle here
    });
  }

  return (
    <div>
      {/* Header + Add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-border-default/50">
        <div>
          <h2 className="text-xl font-600 text-foreground tracking-tight">Mạng lưới Danh sách đen</h2>
          <p className="text-foreground-muted text-sm mt-1">
            {optimisticList.length} tài khoản đang bị hạn chế giao dịch.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-accent hover:bg-accent-bright bg-opacity-100 text-white px-5 py-2.5 rounded-lg text-sm font-500 shadow-cta-glow transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus size={16} /> Khoá Tài khoản
        </button>
      </div>

      {/* Grid danh sách */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
      >
        {optimisticList.map((entry) => {
          const prefix = entry.account_id.charAt(0).toUpperCase();
          const badgeStyle = ACCOUNT_TYPE_COLORS[prefix] ?? "bg-surface text-foreground-muted border-border-default";
          return (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
              }}
              key={entry.account_id}
              className="group relative overflow-hidden bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl p-5 border border-border-default shadow-cinematic transition-all duration-300 hover:shadow-cinematic-hover hover:border-border-hover hover:-translate-y-0.5"
            >
              {/* Inner highlight */}
              <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-inner-glow" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose/10 text-rose flex items-center justify-center border border-rose/20 shadow-[0_0_12px_rgba(225,29,72,0.15)] group-hover:bg-rose/20 transition-colors">
                    <ShieldX size={16} />
                  </div>
                  <span className="font-600 tracking-tight text-foreground font-mono">
                    {entry.account_id}
                  </span>
                </div>
                <span className={cn("text-[10px] font-mono tracking-widest uppercase px-2 py-1 rounded border", badgeStyle)}>
                  {prefix === "C" ? "Cá nhân" : "Doanh nghiệp"}
                </span>
              </div>
              
              <p className="text-foreground-muted font-400 text-sm leading-relaxed mb-4 line-clamp-2 relative z-10">
                {entry.reason}
              </p>
              
              <div className="pt-3 border-t border-border-default/50 flex flex-col relative z-10 gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-foreground-subtle text-mono">Bị khoá lúc</span>
                <p className="text-foreground-subtle text-xs text-mono">
                  {new Date(entry.added_at).toLocaleString("vi-VN", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Modal Thêm vào Blacklist */}
      <AnimatePresence>
        {showModal && (
          <AddBlacklistModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddBlacklistModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (entry: BlacklistEntry) => void;
}) {
  const [accountId, setAccountId] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId.trim() || !reason.trim()) return;
    onAdd({
      account_id: accountId.trim().toUpperCase(),
      reason: reason.trim(),
      added_at: new Date().toISOString(),
    });
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-background-base/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 bg-background-elevated w-full max-w-md rounded-2xl shadow-cinematic-hover border border-border-default overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none shadow-inner-glow rounded-2xl" />
        
        <div className="px-6 py-5 flex items-center justify-between border-b border-border-default/50 bg-white/[0.02]">
          <h3 className="text-lg font-600 text-foreground tracking-tight">Thêm vào Danh sách</h3>
          <button
            onClick={onClose}
            className="text-foreground-subtle hover:text-foreground hover:bg-surface w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono tracking-widest text-foreground-subtle uppercase">
              Mã Tài khoản
            </label>
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="VD: C12345678"
              className="w-full bg-[#0F0F12] text-foreground border border-border-default px-4 py-2.5 rounded-lg text-sm font-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-foreground-subtle/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono tracking-widest text-foreground-subtle uppercase">
              Lý do Khoá
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Chuyển tiền đáng ngờ"
              className="w-full bg-[#0F0F12] text-foreground border border-border-default px-4 py-2.5 rounded-lg text-sm font-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-foreground-subtle/50"
              required
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent-bright text-white py-2.5 rounded-lg font-500 text-sm transition-all duration-200 shadow-cta-glow transform hover:-translate-y-0.5 active:scale-95 active:shadow-none"
            >
              Xác nhận Khoá
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
