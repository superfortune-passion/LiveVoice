"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReportReason } from "@/types/socket";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "harassment", label: "Harassment or bullying" },
  { id: "spam", label: "Spam or bot" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "underage", label: "Appears under 18" },
  { id: "other", label: "Other" },
];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
  submitting?: boolean;
}

export function ReportModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
}: ReportModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-labelledby="report-title"
            aria-modal="true"
            className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <h2 id="report-title" className="text-lg font-semibold text-white">
              Report abuse
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              For harassment, spam, or unsafe behavior only. This does not
              change microphone or speaker settings.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => onSubmit(r.id)}
                  className="min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-rose-500/40 hover:bg-rose-950/30 focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:opacity-50"
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full min-h-[44px] rounded-xl text-sm text-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
