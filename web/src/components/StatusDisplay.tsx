"use client";

import { motion } from "framer-motion";
import type { ConnectionStatus } from "@/types/socket";

const config: Record<
  ConnectionStatus,
  { label: string; sub: string; color: string; pulse?: boolean }
> = {
  idle: {
    label: "Ready",
    sub: "Start matching when you're ready",
    color: "text-slate-300",
  },
  searching: {
    label: "Searching",
    sub: "Finding someone compatible…",
    color: "text-amber-300",
    pulse: true,
  },
  connected: {
    label: "Connected",
    sub: "You're in a live voice chat",
    color: "text-emerald-300",
  },
  disconnected: {
    label: "Partner left",
    sub: "Reconnecting you to the queue…",
    color: "text-orange-300",
  },
  error: {
    label: "Connection issue",
    sub: "Reconnecting to server…",
    color: "text-rose-300",
    pulse: true,
  },
};

interface StatusDisplayProps {
  status: ConnectionStatus;
}

export function StatusDisplay({ status }: StatusDisplayProps) {
  const c = config[status];

  return (
    <div className="text-center">
      <motion.p
        key={status}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-3xl font-bold tracking-tight sm:text-4xl ${c.color}`}
      >
        <span className="inline-flex items-center justify-center gap-3">
          {c.pulse && (
            <span
              className="inline-block h-3 w-3 rounded-full bg-current animate-pulse"
              aria-hidden
            />
          )}
          {c.label}
        </span>
      </motion.p>
      <p className="mt-2 text-sm text-slate-500">{c.sub}</p>
    </div>
  );
}
