"use client";

import { motion } from "framer-motion";

interface VoiceActivityIndicatorProps {
  label: string;
  isSpeaking: boolean;
  isMuted?: boolean;
  variant?: "local" | "remote";
}

export function VoiceActivityIndicator({
  label,
  isSpeaking,
  isMuted = false,
  variant = "remote",
}: VoiceActivityIndicatorProps) {
  const active = isSpeaking && !isMuted;
  const ring =
    variant === "local"
      ? "from-violet-500/40 to-fuchsia-500/40"
      : "from-cyan-500/40 to-blue-500/40";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
        {active && (
          <>
            <motion.span
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${ring}`}
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className={`absolute inset-2 rounded-full bg-gradient-to-br ${ring}`}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.15,
              }}
            />
          </>
        )}
        <div
          className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors sm:h-20 sm:w-20 ${
            active
              ? "border-white/60 bg-white/10"
              : "border-white/20 bg-white/5"
          }`}
        >
          <svg
            className={`h-8 w-8 ${active ? "text-white" : "text-white/40"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      </div>
      <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
        {label}
        {isMuted && " (muted)"}
      </span>
    </div>
  );
}
