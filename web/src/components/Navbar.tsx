"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { AppPhase } from "@/types/app";
import type { PlatformStats } from "@/types/app";
import { phaseThemes } from "@/lib/phase-theme";

export type NavbarMode = "landing" | "session";

interface NavbarProps {
  mode: NavbarMode;
  socketConnected: boolean;
  sessionPhase?: AppPhase;
  stats: PlatformStats | null;
  hasLiveStats: boolean;
  networkOnly: boolean;
  onEnd?: () => void;
}

export const Navbar = memo(function Navbar({
  mode,
  socketConnected,
  sessionPhase = "idle",
  stats,
  hasLiveStats,
  networkOnly,
  onEnd,
}: NavbarProps) {
  const phase = mode === "session" ? sessionPhase : "idle";
  const theme = phaseThemes[phase];

  const liveLabel =
    socketConnected && hasLiveStats && stats
      ? `${stats.online} online`
      : socketConnected
        ? "Network live"
        : "Offline";

  return (
    <header className="relative z-30 shrink-0 border-b border-white/10 bg-[#0D0F17]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          prefetch={false}
          scroll={false}
          className="group flex min-w-0 shrink items-center gap-2.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
        >
          <motion.span
            whileHover={{ scale: 1.05, rotate: 3 }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00E5FF] via-[#FF00C2] to-[#FF0062] text-sm font-bold text-white shadow-[0_0_20px_-4px_rgba(255,0,194,0.6)]"
          >
            V
          </motion.span>
          <span className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
            VoiceLink
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div
            className="hidden max-w-[160px] truncate text-xs font-medium text-[#B0B8C8] sm:block"
            role="status"
            title={
              hasLiveStats && stats
                ? `${stats.waiting} waiting · ${stats.inCall} in call`
                : undefined
            }
          >
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                socketConnected ? "bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.9)]" : "animate-pulse bg-[#FFC107]"
              }`}
            />
            {networkOnly && socketConnected ? "Matchmaking network" : liveLabel}
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold sm:px-3 ${theme.badge}`}
            role="status"
          >
            {(phase === "connected" || phase === "searching" || phase === "connecting") && (
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            )}
            {theme.label}
          </span>

          {mode === "session" && onEnd && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnd}
              className="min-h-[40px] shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[#B0B8C8] transition hover:border-[#E53935]/50 hover:bg-[#E53935]/15 hover:text-white sm:text-sm"
              aria-label="End session"
            >
              End
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
});
