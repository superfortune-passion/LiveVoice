"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeakingIndicatorProps {
  visible: boolean;
  label?: string;
  size?: "sm" | "md";
  variant?: "you" | "partner" | "both";
}

const variantStyles = {
  you: "border-[#FF00C2]/45 bg-[#FF00C2]/12 text-[#FF00C2]",
  partner: "border-[#00E5FF]/45 bg-[#00E5FF]/12 text-[#00E5FF]",
  both: "border-[#4CAF50]/50 bg-[#4CAF50]/12 text-[#4CAF50]",
};

export const SpeakingIndicator = memo(function SpeakingIndicator({
  visible,
  label = "Voice active",
  size = "md",
  variant = "both",
}: SpeakingIndicatorProps) {
  const dot = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.88, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -4 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 font-bold ${variantStyles[variant]}`}
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex ${dot} animate-ping rounded-full bg-current opacity-60`}
            />
            <span className={`relative inline-flex ${dot} rounded-full bg-current`} />
          </span>
          <span className="text-xs sm:text-sm">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
