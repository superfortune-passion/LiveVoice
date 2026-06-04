"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { sanitizeInterestsFromInput } from "@/lib/sanitize";

interface InterestsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (interests: string[]) => void | Promise<void>;
  initialTags?: string[];
}

export function InterestsModal({
  open,
  onClose,
  onConfirm,
  initialTags = [],
}: InterestsModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [input, setInput] = useState(() => initialTags.join(", "));

  const runConfirm = async (tags: string[]) => {
    if (tags.length === 0 && input.trim().length > 0) {
      setHint("Tags must be 2–32 characters, letters and numbers only.");
      return;
    }
    setSubmitting(true);
    setHint(null);
    try {
      await onConfirm(tags);
      setInput("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runConfirm(sanitizeInterestsFromInput(input));
  };

  const handleSkipInterests = () => {
    void runConfirm([]);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-labelledby="interests-title"
        aria-modal="true"
        className="glass-panel fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto max-h-[85dvh] max-w-lg overflow-y-auto p-6 sm:inset-x-auto sm:bottom-auto sm:top-[12%]"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
      >
        <h2 id="interests-title" className="text-lg font-semibold text-white">
          Add interests (optional)
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Comma-separated tags. Letters, numbers, spaces, hyphens only. Max 10
          tags.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="music, gaming, philosophy…"
            className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            maxLength={200}
            autoFocus
            enterKeyHint="go"
            autoComplete="off"
          />
          {hint && (
            <p className="text-sm text-amber-400" role="alert">
              {hint}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSkipInterests}
              disabled={submitting}
              className="min-h-[48px] touch-manipulation rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white"
            >
              Skip — random match
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] touch-manipulation rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              {submitting ? "Starting…" : "Start matching"}
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
