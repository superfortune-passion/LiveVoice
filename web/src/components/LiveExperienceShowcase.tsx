"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShowcasePhase, type ShowcasePhase } from "@/hooks/useShowcasePhase";
import { HeroWaveform } from "./HeroWaveform";
import { SpeakingIndicator } from "./SpeakingIndicator";
import { VoiceOrb } from "./VoiceOrb";

const PHASE_COPY: Record<
  ShowcasePhase,
  { title: string; subtitle: string }
> = {
  idle: {
    title: "Ready when you are",
    subtitle: "Tap Start matching to join.",
  },
  searching: {
    title: "Finding someone now",
    subtitle: "Matching you with a stranger…",
  },
  connecting: {
    title: "Securing your line",
    subtitle: "Setting up encrypted audio…",
  },
  connected: {
    title: "Live conversation",
    subtitle: "You're connected — speak freely.",
  },
};

interface LiveExperienceShowcaseProps {
  variant?: "default" | "compact";
  /** When false, show preview copy instead of the animated demo cycle. */
  socketConnected?: boolean;
}

export const LiveExperienceShowcase = memo(function LiveExperienceShowcase({
  variant = "default",
  socketConnected = true,
}: LiveExperienceShowcaseProps) {
  const { phase, partnerSpeaking, localSpeaking, pause, resume } =
    useShowcasePhase({ enabled: socketConnected });
  const displayPhase = socketConnected ? phase : "idle";
  const copy = socketConnected
    ? PHASE_COPY[displayPhase]
    : {
        title: "Preview only",
        subtitle: "Connect to the network (green dot in header) to match for real.",
      };
  const isConnected = socketConnected && displayPhase === "connected";
  const isSearching =
    socketConnected &&
    (displayPhase === "searching" || displayPhase === "connecting");
  const compact = variant === "compact";

  return (
    <div
      className={
        compact
          ? "live-showcase glass-panel-strong relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl p-3 sm:rounded-[1.25rem] sm:p-4"
          : "live-showcase glass-panel-strong relative overflow-hidden rounded-[2rem] p-5 sm:p-8"
      }
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,0,194,0.12), transparent 65%)",
        }}
      />

      <div
        className={
          compact
            ? "relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center sm:gap-3"
            : "relative flex flex-col items-center gap-6 text-center"
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayPhase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className={compact ? "space-y-0.5" : "space-y-1"}
          >
            {!compact && (
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#00E5FF]">
                Live preview
              </p>
            )}
            <h3
              className={
                compact
                  ? "text-base font-bold text-white sm:text-lg"
                  : "text-xl font-bold text-white sm:text-2xl"
              }
            >
              {copy.title}
            </h3>
            <p
              className={
                compact
                  ? "max-w-sm text-[11px] leading-snug text-[#B0B8C8] sm:text-xs"
                  : "max-w-md text-sm text-[#B0B8C8]"
              }
            >
              {copy.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        <VoiceOrb
          phase={isConnected ? "connected" : isSearching ? "searching" : "idle"}
          demo
          speaking={isConnected && (partnerSpeaking || localSpeaking)}
          size="hero"
          className={
            compact
              ? "mx-auto max-h-[min(32vw,168px)] sm:max-h-[min(28vw,200px)] lg:max-h-[min(22vw,220px)]"
              : "mx-auto max-h-[min(52vw,300px)]"
          }
        />

        <div
          className={
            compact ? "w-full max-w-md px-0.5" : "w-full max-w-lg px-1"
          }
        >
          {isConnected ? (
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-xl border p-2 transition-shadow ${
                  localSpeaking
                    ? "border-[#FF00C2]/50 shadow-[0_0_20px_-6px_rgba(255,0,194,0.45)]"
                    : "border-white/10"
                }`}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#FF00C2]">
                  You
                </p>
                <HeroWaveform
                  active
                  speaking={localSpeaking}
                  demoPhase="connected"
                  barCount={20}
                />
              </div>
              <div
                className={`rounded-xl border p-2 transition-shadow ${
                  partnerSpeaking
                    ? "border-[#4CAF50]/50 shadow-[0_0_20px_-6px_rgba(76,175,80,0.4)]"
                    : "border-white/10"
                }`}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#4CAF50]">
                  Stranger
                </p>
                <HeroWaveform
                  active
                  speaking={partnerSpeaking}
                  demoPhase="connected"
                  barCount={20}
                />
              </div>
            </div>
          ) : (
            <HeroWaveform
              active
              speaking={isSearching}
              demoPhase={displayPhase}
              barCount={compact ? 28 : 40}
            />
          )}
        </div>

        <AnimatePresence>
          {isConnected && (
            <SpeakingIndicator
              visible
              label={partnerSpeaking ? "Partner speaking" : "You're speaking"}
              variant={partnerSpeaking ? "partner" : "you"}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
