"use client";

import { memo, useCallback, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import {
  INTEREST_ACCENTS,
  type PopularInterest,
} from "@/lib/popular-interests";

interface InterestCardProps {
  interest: PopularInterest;
  selected: boolean;
  disabled?: boolean;
  index: number;
  networkLive?: boolean;
  onToggle: (tag: string) => void;
}

function CheckBadge() {
  return (
    <span
      className="interest-card-check flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0d0f17] shadow-lg"
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2.5 7.2L5.5 10.2L11.5 3.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export const InterestCard = memo(function InterestCard({
  interest,
  selected,
  disabled,
  index,
  networkLive,
  onToggle,
}: InterestCardProps) {
  const reduceMotion = useReducedMotion();
  const accent = INTEREST_ACCENTS[interest.accent.hue];

  const handleClick = useCallback(() => {
    onToggle(interest.tag);
  }, [interest.tag, onToggle]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle(interest.tag);
      }
    },
    [interest.tag, onToggle]
  );

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      aria-label={`${selected ? "Deselect" : "Select"} ${interest.label}. ${interest.subtitle}`}
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: reduceMotion ? 0 : 0.03 + index * 0.035,
        duration: 0.38,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={
        reduceMotion || disabled
          ? undefined
          : { y: -4, transition: { duration: 0.18 } }
      }
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
      layout
      className={clsx(
        "interest-card group relative flex min-h-[88px] w-full flex-col items-start rounded-2xl border p-3 text-left touch-manipulation sm:min-h-[96px] sm:p-3.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f17]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        selected ? "interest-card--selected" : "interest-card--idle"
      )}
      style={
        selected
          ? ({
              "--interest-ring": accent.ring,
              "--interest-glow": accent.glow,
              "--interest-gradient": accent.gradient,
            } as React.CSSProperties)
          : ({
              "--interest-ring": accent.ring,
            } as React.CSSProperties)
      }
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden
        style={{
          background:
            "linear-gradient(135deg, rgb(255 255 255 / 0.04), transparent 55%)",
        }}
      />

      {selected && (
        <motion.span
          className="absolute right-2.5 top-2.5 z-10"
          initial={reduceMotion ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 26 }}
        >
          <CheckBadge />
        </motion.span>
      )}

      <span
        className="interest-card-icon text-[1.75rem] leading-none sm:text-[2rem]"
        aria-hidden
      >
        {interest.icon}
      </span>

      <span className="mt-2 text-sm font-bold leading-tight text-white sm:text-[0.9375rem]">
        {interest.label}
      </span>

      <span className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#B0B8C8] sm:text-[11px]">
        {interest.subtitle}
      </span>

      <span className="mt-auto flex w-full items-center gap-1.5 pt-2">
        <span
          className={clsx(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            networkLive ? "bg-[#4CAF50] shadow-[0_0_6px_rgba(76,175,80,0.85)]" : "bg-white/25"
          )}
          aria-hidden
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B0B8C8]/90">
          {networkLive ? "Matching now" : "Ready to match"}
        </span>
      </span>
    </motion.button>
  );
});
