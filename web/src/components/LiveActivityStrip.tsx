"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useAnimatedStat } from "@/hooks/useAnimatedStat";
import { networkStatusHint } from "@/lib/app-environment";
import type { PlatformStats } from "@/types/app";

interface LiveActivityStripProps {
  stats: PlatformStats | null;
  hasLiveStats: boolean;
  socketConnected: boolean;
  connectError?: string | null;
  variant?: "strip" | "inline";
}

function offlineHint(connectError?: string | null): string {
  return networkStatusHint(false, connectError);
}

function StatPill({
  dotClass,
  label,
  value,
}: {
  dotClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="live-stat-pill flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 sm:px-4 sm:py-3">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[#B0B8C8] sm:text-[11px]">
          {label}
        </p>
        <p className="truncate text-sm font-bold tabular-nums text-white sm:text-base">
          {value}
        </p>
      </div>
    </div>
  );
}

export const LiveActivityStrip = memo(function LiveActivityStrip({
  stats,
  hasLiveStats,
  socketConnected,
  connectError,
  variant = "strip",
}: LiveActivityStripProps) {
  const online = useAnimatedStat(stats?.online ?? 0);
  const inCall = useAnimatedStat(stats?.inCall ?? 0);
  const waiting = useAnimatedStat(stats?.waiting ?? 0);

  const live = socketConnected && hasLiveStats && stats;
  const inline = variant === "inline";

  if (inline) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm lg:justify-start"
        role="status"
        aria-live="polite"
      >
        {!socketConnected && (
          <span className="max-w-full font-medium text-[#FFC107]">
            {offlineHint(connectError)}
          </span>
        )}
        {socketConnected && !live && (
          <span className="inline-flex items-center gap-1.5 font-medium text-[#4CAF50]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4CAF50]" />
            Network live
          </span>
        )}
        {live && (
          <>
            <span className="inline-flex items-center gap-1.5 tabular-nums text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4CAF50] shadow-[0_0_6px_rgba(76,175,80,0.8)]" />
              <span className="font-bold text-[#4CAF50]">{online}</span>
              <span className="text-[#B0B8C8]">online</span>
            </span>
            <span className="hidden text-[#B0B8C8]/50 sm:inline" aria-hidden>
              ·
            </span>
            <span className="hidden tabular-nums text-[#B0B8C8] sm:inline">
              <span className="font-semibold text-[#00E5FF]">{inCall}</span> in
              call
            </span>
            <span className="hidden text-[#B0B8C8]/50 md:inline" aria-hidden>
              ·
            </span>
            <span className="hidden tabular-nums text-[#B0B8C8] md:inline">
              <span className="font-semibold text-[#FF00C2]">{waiting}</span>{" "}
              waiting
            </span>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="w-full"
      role="status"
      aria-live="polite"
    >
      <div className="live-activity-strip glass-panel-strong flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-stretch sm:gap-2 sm:p-4">
        {!socketConnected && (
          <p className="w-full text-center text-sm font-medium text-[#FFC107] sm:text-left">
            {offlineHint(connectError)}
          </p>
        )}
        {socketConnected && !live && (
          <p className="w-full text-center text-sm font-medium text-[#4CAF50] sm:text-left">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4CAF50]" />
            Connected — live stats loading
          </p>
        )}
        {live && (
          <>
            <StatPill
              dotClass="bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.8)]"
              label="People online"
              value={`${online}`}
            />
            <StatPill
              dotClass="bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.7)]"
              label="Active conversations"
              value={`${inCall}`}
            />
            <StatPill
              dotClass="bg-[#FF00C2] shadow-[0_0_8px_rgba(255,0,194,0.6)]"
              label="Waiting to match"
              value={`${waiting}`}
            />
          </>
        )}
      </div>
      {live && (
        <p className="mt-2 text-center text-[11px] text-[#B0B8C8] sm:text-left">
          Real-time counts from the VoiceLink network — never estimated.
        </p>
      )}
    </motion.div>
  );
});
