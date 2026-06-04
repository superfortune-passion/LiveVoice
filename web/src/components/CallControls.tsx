"use client";

import { memo } from "react";
import { motion } from "framer-motion";

interface CallControlsProps {
  isMuted: boolean;
  canSkip: boolean;
  canReport: boolean;
  hasLocalStream: boolean;
  onToggleMute: () => void;
  onSkip: () => void;
  onReport: () => void;
  onEnd: () => void;
}

function IconMic({ muted }: { muted: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="icon-strong" aria-hidden>
      {muted ? (
        <>
          <path
            d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
            stroke="currentColor"
            strokeWidth="2.25"
          />
          <path d="M5 5l14 14" stroke="currentColor" strokeWidth="1.75" />
        </>
      ) : (
        <>
          <path
            d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
            stroke="currentColor"
            strokeWidth="2.25"
          />
          <path
            d="M19 11v1a7 7 0 0 1-14 0v-1M12 19v3"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export const CallControls = memo(function CallControls({
  isMuted,
  canSkip,
  canReport,
  hasLocalStream,
  onToggleMute,
  onSkip,
  onReport,
  onEnd,
}: CallControlsProps) {
  const btn =
    "group flex min-h-[52px] min-w-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-35 sm:min-w-[64px] sm:text-xs";

  return (
    <motion.nav
      className="call-controls-dock mx-auto w-full max-w-md"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 26 }}
      aria-label="Call controls"
    >
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onToggleMute}
          disabled={!hasLocalStream}
          aria-pressed={isMuted}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className={`${btn} border border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10`}
        >
          <IconMic muted={isMuted} />
          {isMuted ? "Unmute" : "Mute"}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onSkip}
          disabled={!canSkip}
          aria-label="Skip"
          className={`${btn} bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-900/30`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="icon-strong" aria-hidden>
            <path
              d="M5 12h12M13 7l5 5-5 5"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Skip
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReport}
          disabled={!canReport}
          aria-label="Report user for abuse (not for microphone)"
          className={`${btn} border border-rose-500/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="icon-strong" aria-hidden>
            <path
              d="M12 9v4m0 4h.01M10.3 4.5h3.4L20 18H4l6.3-13.5Z"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Report
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onEnd}
          aria-label="End session"
          className={`${btn} border border-white/12 bg-slate-800/90 text-slate-200 hover:border-rose-500/30 hover:bg-rose-950/50 hover:text-rose-100`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="icon-strong" aria-hidden>
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </svg>
          End
        </motion.button>
      </div>
    </motion.nav>
  );
});
