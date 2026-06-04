"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { micErrorMessage } from "@/hooks/useAppPhase";
import type { MicError } from "@/hooks/useWebRTC";
import { hasProductionMicParity, micStepDescription } from "@/lib/app-environment";
import type { MicPermissionState } from "@/lib/mic-access";

interface MicrophoneEnableCardProps {
  permission: MicPermissionState;
  micReady: boolean;
  isRequesting: boolean;
  micError: MicError;
  onEnable: () => void;
}

export const MicrophoneEnableCard = memo(function MicrophoneEnableCard({
  permission,
  micReady,
  isRequesting,
  micError,
  onEnable,
}: MicrophoneEnableCardProps) {
  const reduceMotion = useReducedMotion();
  const errText = micErrorMessage(micError);

  if (micReady) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-[#4CAF50]/35 bg-[#4CAF50]/10 px-4 py-3"
        role="status"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4CAF50]/20 text-lg"
          aria-hidden
        >
          ✓
        </span>
        <div>
          <p className="text-sm font-bold text-[#4CAF50]">Microphone ready</p>
          <p className="text-xs text-[#B0B8C8]">
            You can start matching below.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#00E5FF]/30 bg-gradient-to-br from-[#00E5FF]/10 to-[#FF00C2]/8 p-4"
      role="region"
      aria-label="Microphone access"
    >
      <p className="text-sm font-bold text-white">Step 1 — Enable microphone</p>
      <p className="mt-1 text-xs leading-relaxed text-[#B0B8C8]">
        {micStepDescription(permission)}
      </p>

      {errText && (
        <p className="mt-2 text-xs font-medium text-amber-200" role="alert">
          {errText}
        </p>
      )}

      <motion.button
        type="button"
        onClick={onEnable}
        disabled={isRequesting || !hasProductionMicParity()}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className="btn-cta-primary mt-4 w-full min-h-[52px] touch-manipulation rounded-2xl px-6 py-3.5 text-base font-bold disabled:opacity-50"
      >
        {isRequesting
          ? "Waiting for browser…"
          : permission === "denied"
            ? "Try microphone again"
            : "Allow microphone"}
      </motion.button>
    </motion.div>
  );
});
