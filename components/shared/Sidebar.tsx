"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Home, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sidebar: Compact, Fixed-position, Cinematic Native App Feel
 * - Fixed to screen (sticky on scroll)
 * - Compact icon + label layout
 * - Responsive: narrow on smaller screens
 */
export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ─── MOBILE TOPBAR (Visible only on small screens) ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-30 bg-background-elevated/80 backdrop-blur-2xl border-b border-border-default flex items-center px-4 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface border border-border-default shadow-inner-glow flex items-center justify-center shrink-0">
            <ShieldAlert className="text-foreground w-3.5 h-3.5" strokeWidth={2} />
          </div>
          <span className="text-foreground font-600 text-base tracking-tight whitespace-nowrap">
            FraudGuard
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface transition-colors focus:outline-none"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ─── OVERLAY (Mobile only) ─── */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background-base/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-56 z-50 flex flex-col bg-background-elevated/80 backdrop-blur-2xl border-r border-border-default shrink-0 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>

        {/* Brand */}
        <div className="px-4 py-5 border-b border-border-default/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-surface border border-border-default shadow-inner-glow flex items-center justify-center shrink-0">
              <ShieldAlert className="text-foreground w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <span className="text-foreground font-600 text-base tracking-tight whitespace-nowrap">
              FraudGuard
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-surface focus:outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-5 space-y-1 overflow-y-auto">
          <p className="px-2 text-[10px] font-500 uppercase tracking-widest text-foreground-muted mb-3 font-mono">
            Hệ thống
          </p>
          <NavItem href="/" icon={<Home size={15} />} label="Tổng quan" onClick={() => setIsOpen(false)} />
          <NavItem href="/blacklist" icon={<ShieldAlert size={15} />} label="Danh sách đen" onClick={() => setIsOpen(false)} />
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border-default/50 bg-background-base/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0" />
            <p className="text-foreground-muted text-[11px] font-500 whitespace-nowrap">Đang hoạt động</p>
          </div>
          <p className="text-foreground-subtle text-[10px] mt-0.5 font-mono tracking-widest uppercase">v3.0</p>
        </div>
      </aside>
    </>
  );
}

function NavItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface transition-all duration-200 font-500 text-sm group whitespace-nowrap"
    >
      <span className="text-foreground-subtle group-hover:text-foreground transition-colors duration-200 shrink-0">
        {icon}
      </span>
      {label}
    </Link>
  );
}
