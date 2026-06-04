"use client";

import { motion } from "framer-motion";
import type { PlatformStats } from "@/types/app";

interface OnlineCounterProps {
  stats: PlatformStats | null;
  hasLiveStats: boolean;
  networkOnly: boolean;
  socketConnected: boolean;
}

export function OnlineCounter({
  stats,
  hasLiveStats,
  networkOnly,
  socketConnected,
}: OnlineCounterProps) {
  if (!socketConnected) {
    return (
      <motion.div
        className="glass-panel-strong inline-flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3"
        role="status"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
        <p className="text-left text-sm text-slate-400">
          Connecting to matchmaking network…
        </p>
      </motion.div>
    );
  }

  if (networkOnly || !hasLiveStats || !stats) {
    return (
      <motion.div
        className="glass-panel-strong inline-flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3"
        role="status"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
        </span>
        <p className="text-left text-sm font-medium text-emerald-300">
          Connected to matchmaking network
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="glass-panel-strong inline-flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_0_40px_-15px_rgba(52,211,153,0.25)]"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      <div className="text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Live on VoiceLink
        </p>
        <p className="text-lg font-bold tabular-nums text-white">
          {stats.online} online
        </p>
      </div>
      <div className="border-l border-white/10 pl-3 text-xs text-slate-500">
        <p>{stats.waiting} waiting</p>
        <p>{stats.inCall} in call</p>
      </div>
    </motion.div>
  );
}
