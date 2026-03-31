"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  Home, 
  Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sidebar: Premium SOC Dashboard
 * - Fixed layout
 * - Nav active states with accent glow
 */
export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 z-40 flex flex-col bg-background-elevated/80 backdrop-blur-2xl border-r border-border-default shrink-0">

      {/* Brand */}
      <div className="px-5 py-6 border-b border-border-default/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface border border-border-default shadow-inner-glow flex items-center justify-center shrink-0">
            <ShieldAlert className="text-foreground w-4 h-4" strokeWidth={2} />
          </div>
          <span className="text-foreground font-600 text-lg tracking-tight whitespace-nowrap">
            Sentinel Core
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-500 uppercase tracking-widest text-foreground-muted mb-3 font-mono">
          Điều hướng Hệ thống
        </p>
        <NavItem href="/" icon={<Home size={16} />} label="Tổng quan" />
        <NavItem href="/blacklist" icon={<Activity size={16} />} label="Mạng lưới (Network)" />
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border-default/50 bg-background-base/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <p className="text-foreground-muted text-[11px] font-mono tracking-widest uppercase">SYSLINK_OK</p>
          </div>
          <p className="text-foreground-subtle text-[10px] font-mono tracking-widest uppercase">v4.0.0</p>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href && href !== "#";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 font-500 text-sm group whitespace-nowrap",
        isActive 
          ? "bg-accent/10 text-foreground border border-accent/20 shadow-[0_0_12px_rgba(94,106,210,0.1)]" 
          : "text-foreground-muted hover:text-foreground hover:bg-surface border border-transparent"
      )}
    >
      <span className={cn(
        "transition-colors duration-300 shrink-0",
        isActive ? "text-accent" : "text-foreground-subtle group-hover:text-foreground"
      )}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
