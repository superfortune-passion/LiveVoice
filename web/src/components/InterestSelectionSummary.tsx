"use client";

import { memo, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import { selectionCountLabel } from "@/lib/interest-cta";
import { INTEREST_LABELS } from "@/lib/popular-interests";

interface InterestSelectionSummaryProps {
  tags: string[];
  onRemove: (tag: string) => void;
}

export const InterestSelectionSummary = memo(function InterestSelectionSummary({
  tags,
  onRemove,
}: InterestSelectionSummaryProps) {
  const reduceMotion = useReducedMotion();
  const countLabel = useMemo(() => selectionCountLabel(tags.length), [tags.length]);

  return (
    <div
      className="interest-selection-summary rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-md sm:px-4 sm:py-3.5"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-white">Selected Interests</h3>
        <motion.p
          key={countLabel}
          initial={reduceMotion ? false : { opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          className={clsx(
            "text-xs font-semibold tabular-nums",
            tags.length > 0 ? "text-[#00E5FF]" : "text-[#B0B8C8]"
          )}
        >
          {countLabel}
        </motion.p>
      </div>

      <AnimatePresence mode="popLayout">
        {tags.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs leading-relaxed text-[#B0B8C8]"
          >
            Pick one or more topics for smarter matches — or start random below.
          </motion.p>
        ) : (
          <motion.ul
            key="pills"
            layout
            className="mt-3 flex flex-wrap gap-2"
            role="list"
          >
            {tags.map((tag) => (
              <motion.li
                key={tag}
                layout
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 480, damping: 28 }}
                role="listitem"
              >
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="interest-summary-pill inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#00E5FF]/35 bg-gradient-to-r from-[#00E5FF]/15 to-[#FF00C2]/10 px-4 py-2 text-sm font-bold text-white transition hover:border-[#FF00C2]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f17]"
                  aria-label={`Remove ${INTEREST_LABELS[tag] ?? tag}`}
                >
                  <span>{INTEREST_LABELS[tag] ?? tag}</span>
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs text-[#B0B8C8] transition group-hover:text-white"
                    aria-hidden
                  >
                    ×
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
});
