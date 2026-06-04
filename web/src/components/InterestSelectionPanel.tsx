"use client";

import { memo, useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { sanitizeInterestList } from "@/lib/interests";
import { primaryMatchLabel } from "@/lib/interest-cta";
import { InterestGrid } from "./InterestGrid";
import { InterestSelectionSummary } from "./InterestSelectionSummary";

interface InterestSelectionPanelProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  onStartWithInterests: (tags: string[]) => void;
  onQuickMatch: () => void;
  socketConnected?: boolean;
  disabled?: boolean;
  /** Match buttons disabled until microphone is enabled (Step 1). */
  matchDisabled?: boolean;
}

export const InterestSelectionPanel = memo(function InterestSelectionPanel({
  selected,
  onChange,
  onStartWithInterests,
  onQuickMatch,
  socketConnected,
  disabled,
  matchDisabled,
}: InterestSelectionPanelProps) {
  const matchLocked = disabled || matchDisabled;
  const reduceMotion = useReducedMotion();
  const sanitized = useMemo(
    () => sanitizeInterestList(selected),
    [selected]
  );
  const primaryLabel = useMemo(
    () => primaryMatchLabel(sanitized.length),
    [sanitized.length]
  );

  const handleRemove = useCallback(
    (tag: string) => {
      onChange(selected.filter((t) => t !== tag));
    },
    [selected, onChange]
  );

  const handlePrimary = useCallback(() => {
    if (sanitized.length > 0) {
      onStartWithInterests(sanitized);
      return;
    }
    onQuickMatch();
  }, [sanitized, onStartWithInterests, onQuickMatch]);

  return (
    <section
      id="interests-section"
      className="interest-selection-panel flex min-h-0 flex-col gap-3 sm:gap-3.5"
      aria-labelledby="interest-selection-heading"
    >
      <header className="shrink-0 text-center lg:text-left">
        <motion.h2
          id="interest-selection-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-lg font-bold tracking-tight text-white sm:text-xl"
        >
          Step 2 — Choose Your Interests
        </motion.h2>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.04 }}
          className="mt-1 text-xs leading-relaxed text-[#B0B8C8] sm:text-sm"
        >
          VoiceLink prioritizes people who share your interests.
        </motion.p>
      </header>

      <div className="interest-selection-surface glass-panel relative max-h-[min(52dvh,440px)] min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[1.35rem] p-2.5 sm:max-h-[min(48dvh,480px)] sm:rounded-[1.5rem] sm:p-3 xl:max-h-none">
        <div
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/35 to-transparent"
          aria-hidden
        />
        <InterestGrid
          selected={selected}
          onChange={onChange}
          disabled={disabled}
          socketConnected={socketConnected}
        />
      </div>

      <InterestSelectionSummary tags={sanitized} onRemove={handleRemove} />

      {matchDisabled && (
        <p className="text-center text-[11px] text-[#B0B8C8] lg:text-left">
          {!socketConnected
            ? "Waiting for matchmaking server — header should show Online or Network live."
            : "Enable microphone above to unlock matching."}
        </p>
      )}

      <div className="flex shrink-0 flex-col gap-2">
        <motion.button
          type="button"
          onClick={handlePrimary}
          disabled={matchLocked}
          whileHover={reduceMotion ? undefined : { scale: 1.02, y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="btn-cta-primary w-full min-h-[52px] touch-manipulation rounded-2xl px-6 py-3.5 text-base font-bold sm:min-h-[56px] sm:text-lg"
          aria-label={primaryLabel}
        >
          {primaryLabel}
        </motion.button>
        <motion.button
          type="button"
          onClick={onQuickMatch}
          disabled={matchLocked}
          whileHover={reduceMotion ? undefined : { scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="btn-secondary w-full min-h-[44px] touch-manipulation rounded-xl px-5 py-2.5 text-sm font-semibold sm:min-h-[48px]"
          aria-label="Quick match without interests"
        >
          Quick match
        </motion.button>
      </div>
    </section>
  );
});
