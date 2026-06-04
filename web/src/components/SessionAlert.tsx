"use client";

import { memo } from "react";
import { motion } from "framer-motion";

type SessionAlertVariant = "warning" | "error" | "info";

const styles: Record<SessionAlertVariant, string> = {
  warning:
    "border-amber-400/45 bg-amber-950/80 text-amber-50 [&_.alert-title]:text-amber-100",
  error:
    "border-rose-400/45 bg-rose-950/85 text-rose-50 [&_.alert-title]:text-rose-100",
  info: "border-cyan-400/35 bg-slate-900/90 text-slate-100 [&_.alert-title]:text-cyan-100",
};

interface SessionAlertProps {
  variant: SessionAlertVariant;
  title: string;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export const SessionAlert = memo(function SessionAlert({
  variant,
  title,
  children,
  action,
}: SessionAlertProps) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left shadow-lg ${styles[variant]}`}
    >
      <p className="alert-title text-sm font-bold">{title}</p>
      <div className="mt-1.5 text-xs leading-relaxed opacity-90">{children}</div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-3 min-h-[44px] w-full rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
});
