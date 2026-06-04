"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { StatusMessage } from "@/types/socket";

const styles: Record<StatusMessage["type"], string> = {
  info: "bg-slate-800/95 border-slate-600 text-slate-100",
  success: "bg-emerald-900/95 border-emerald-600 text-emerald-50",
  warning: "bg-amber-900/95 border-amber-600 text-amber-50",
  error: "bg-rose-900/95 border-rose-600 text-rose-50",
};

const AUTO_DISMISS_MS = 4500;

interface StatusToastProps {
  messages: StatusMessage[];
  onDismiss: (id: string) => void;
  /** In call UI — keep toasts at bottom so alerts don't stack on top */
  inSession?: boolean;
}

export function StatusToast({
  messages,
  onDismiss,
  inSession = false,
}: StatusToastProps) {
  const visible = inSession ? messages.slice(-1) : messages.slice(-2);
  const latestId = visible[visible.length - 1]?.id ?? null;

  useEffect(() => {
    if (!latestId) return;
    const timer = setTimeout(() => onDismiss(latestId), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [latestId, onDismiss]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-4 ${
        inSession
          ? "bottom-[max(5.5rem,env(safe-area-inset-bottom))]"
          : "top-4"
      }`}
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: inSession ? 12 : -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: inSession ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto max-w-md rounded-xl border px-4 py-2.5 text-sm shadow-lg backdrop-blur-md ${styles[msg.type]}`}
            onClick={() => onDismiss(msg.id)}
            role="status"
          >
            {msg.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
