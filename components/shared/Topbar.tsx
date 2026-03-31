"use client";

import { Search, Bell, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Topbar() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border-default/50 bg-background-elevated/80 backdrop-blur-xl px-4 lg:px-8">
      
      {/* Search Section */}
      <div className="flex flex-1 items-center gap-4">
        <button className="lg:hidden text-foreground-muted hover:text-foreground transition-colors">
          <Menu size={20} />
        </button>
        
        <div className={cn(
          "relative flex items-center w-full max-w-md transition-all duration-300",
          isFocused ? "opacity-100" : "opacity-70 xl:opacity-100"
        )}>
          <Search size={16} className={cn(
            "absolute left-3 transition-colors duration-300",
            isFocused ? "text-accent" : "text-foreground-subtle"
          )} />
          <input 
            type="text" 
            placeholder="Search logs, IPs, or users (Cmd+K)" 
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="h-10 w-full rounded-md border border-border-default bg-[#0F0F12] pl-10 pr-4 text-sm tracking-tight text-foreground transition-all duration-300 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-foreground-subtle/50 font-mono"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Real-time Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald/20 bg-emerald/5 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-emerald uppercase">Live Network</span>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border-default/50 hidden sm:block" />

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-surface text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground">
          <Bell size={18} />
          {/* Badge */}
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 rounded-full bg-rose shadow-[0_0_8px_rgba(225,29,72,0.6)]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-75"></span>
          </span>
        </button>

        {/* Profile */}
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-gradient-to-br from-accent/20 to-transparent">
          <User size={16} className="text-accent" />
        </div>
      </div>
    </header>
  );
}
