"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AppPhase } from "@/types/app";
import { micErrorMessage } from "@/hooks/useAppPhase";
import { formatCallDuration } from "@/hooks/useCallTimer";
import type { MicError } from "@/hooks/useWebRTC";
import { fadeSlide, scaleFade } from "@/lib/motion";
import { phaseThemes } from "@/lib/phase-theme";
import { anonymousPeerLabel } from "@/lib/anonymous-peer";
import { INTEREST_LABELS } from "@/lib/popular-interests";
import type { ConnectionQuality } from "@/hooks/useConnectionQuality";
import { ConnectionQualityBadge } from "./ConnectionQualityBadge";
import { DualVoiceVisualizer } from "./DualVoiceVisualizer";
import { HeroWaveform } from "./HeroWaveform";
import { SpeakingIndicator } from "./SpeakingIndicator";
import { VoiceOrb } from "./VoiceOrb";

interface MatchStateCardProps {
  phase: AppPhase;
  micError?: MicError;
  callSeconds?: number;
  sharedInterests?: string[];
  peerId?: string | null;
  connectionQuality?: ConnectionQuality | null;
  localSpeaking?: boolean;
  remoteSpeaking?: boolean;
  isMuted?: boolean;
  stream?: MediaStream | null;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  onRetryMic?: () => void;
  /** Landing preview — smaller layout with orb only */
  variant?: "hero" | "session";
}

const copy: Record<AppPhase, { title: string; subtitle: string }> = {
  idle: {
    title: "Ready to match",
    subtitle: "Crystal-clear voice. Zero accounts. Instant connection.",
  },
  mic_permission: {
    title: "Allow your microphone",
    subtitle: "VoiceLink needs mic access to pair you with strangers.",
  },
  searching: {
    title: "Finding a musician",
    subtitle: "Matching you with someone who shares your vibe…",
  },
  connecting: {
    title: "Tuning the line",
    subtitle: "Encrypted WebRTC audio — DTLS-SRTP handshake…",
  },
  connected: {
    title: "You're live",
    subtitle: "Low-latency voice — headphones recommended for jamming.",
  },
  peer_disconnected: {
    title: "They left",
    subtitle: "Hang tight — matching you with someone new.",
  },
  error: {
    title: "Connection issue",
    subtitle: "Something interrupted the session.",
  },
};

function speakingLabel(
  local: boolean,
  remote: boolean,
  muted: boolean
): { text: string; variant: "you" | "partner" | "both" } {
  if (local && !muted && remote) return { text: "Both speaking", variant: "both" };
  if (local && !muted) return { text: "You're speaking", variant: "you" };
  if (remote) return { text: "Musician speaking", variant: "partner" };
  return { text: "Listening…", variant: "both" };
}

export const MatchStateCard = memo(function MatchStateCard({
  phase,
  micError,
  callSeconds = 0,
  sharedInterests = [],
  peerId = null,
  connectionQuality = null,
  localSpeaking = false,
  remoteSpeaking = false,
  isMuted = false,
  stream = null,
  localStream = null,
  remoteStream = null,
  onRetryMic,
  variant = "session",
}: MatchStateCardProps) {
  const theme = phaseThemes[phase];
  const c = copy[phase];
  const errMsg = micErrorMessage(micError ?? null);
  const subtitle =
    phase === "error" && errMsg
      ? errMsg
      : phase === "mic_permission" && errMsg
        ? errMsg
        : c.subtitle;

  const isHero = variant === "hero";
  const isConnected = phase === "connected";
  const speaking = localSpeaking || remoteSpeaking;
  const speakMeta = speakingLabel(localSpeaking, remoteSpeaking, isMuted);

  const showDualViz =
    isConnected && (localStream || remoteStream) && variant === "session";
  const showSingleWave =
    !showDualViz &&
    (phase === "searching" ||
      phase === "connecting" ||
      phase === "mic_permission" ||
      phase === "peer_disconnected");

  return (
    <div
      className={`relative w-full overflow-hidden ${
        isHero
          ? "rounded-[2rem]"
          : "glass-panel-strong glow-violet rounded-[2rem] p-5 sm:p-8"
      }`}
    >
      {!isHero && (
        <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-[70%] -translate-x-1/2 rounded-full bg-[#FF00C2]/15 blur-3xl" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          {...fadeSlide}
          className="relative flex flex-col items-center gap-6 text-center sm:gap-7"
        >
          <motion.div
            layout
            className="flex flex-col items-center gap-2"
            {...scaleFade}
          >
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] ${theme.badge}`}
            >
              {theme.label}
            </span>
            <h2
              className={`max-w-md text-2xl font-bold tracking-tight text-white sm:text-3xl ${theme.accent}`}
            >
              {c.title}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-[#B0B8C8]">
              {subtitle}
            </p>
          </motion.div>

          <VoiceOrb
            phase={phase}
            stream={localStream ?? stream ?? null}
            demo={isHero || (!localStream && !stream)}
            speaking={speaking || phase === "searching"}
            size={isHero ? "hero" : isConnected ? "call" : "compact"}
          />

          {isConnected && !isHero && (
            <motion.div
              className="glass-panel w-full max-w-sm rounded-2xl p-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B0B8C8]">
                    On the line
                  </p>
                  <p className="truncate text-base font-bold leading-snug text-white sm:text-lg">
                    {anonymousPeerLabel(peerId)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B0B8C8]">
                    Duration
                  </p>
                  <p className="font-mono text-xl tabular-nums text-white">
                    {formatCallDuration(callSeconds)}
                  </p>
                </div>
              </div>
              {connectionQuality && (
                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  <ConnectionQualityBadge quality={connectionQuality} />
                </div>
              )}
              {sharedInterests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
                  <span className="w-full text-left text-[10px] uppercase tracking-wider text-slate-500">
                    Shared interests
                  </span>
                  {sharedInterests.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/12 px-2.5 py-0.5 text-xs font-semibold text-[#00E5FF]"
                    >
                      {INTEREST_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {showDualViz && (
            <DualVoiceVisualizer
              localStream={localStream ?? stream}
              remoteStream={remoteStream}
              localSpeaking={localSpeaking}
              remoteSpeaking={remoteSpeaking}
              isMuted={isMuted}
            />
          )}

          {showSingleWave && (
            <div className="w-full max-w-lg px-2">
              <HeroWaveform
                active
                speaking={speaking || phase === "searching"}
                calm={phase === "mic_permission"}
                stream={localStream ?? stream}
                demoPhase={phase}
                barCount={44}
              />
            </div>
          )}

          {isHero && (
            <div className="w-full max-w-md px-2">
              <HeroWaveform active speaking demoPhase="idle" barCount={36} />
            </div>
          )}

          {(phase === "mic_permission" || (phase === "error" && micError)) &&
            onRetryMic && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetryMic}
                className="btn-cta-primary min-h-[48px] rounded-2xl px-8 py-3 text-sm font-bold text-white"
              >
                Allow microphone & continue
              </motion.button>
            )}

          {isConnected && !isHero && (
            <SpeakingIndicator
              visible={speaking}
              label={speakMeta.text}
              variant={speakMeta.variant}
              size="sm"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
