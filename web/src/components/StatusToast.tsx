"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { StatusMessage } from "@/types/socket";

const styles: Record<StatusMessage["type"], string> = {
  info: "bg-slate-800/90 border-slate-600 text-slate-100",
  success: "bg-emerald-900/90 border-emerald-600 text-emerald-50",
  warning: "bg-amber-900/90 border-amber-600 text-amber-50",
  error: "bg-rose-900/90 border-rose-600 text-rose-50",
};

interface StatusToastProps {
  messages: StatusMessage[];
  onDismiss: (id: string) => void;
}

export function StatusToast({ messages, onDismiss }: StatusToastProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
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
