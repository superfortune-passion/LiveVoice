"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import type { MicPermissionState } from "@/lib/mic-access";
import type { PlatformStats } from "@/types/app";
import type { MicError } from "@/hooks/useWebRTC";
import { InterestSelectionPanel } from "./InterestSelectionPanel";
import { LiveActivityStrip } from "./LiveActivityStrip";
import { EnvironmentNotice } from "./EnvironmentNotice";
import { MicrophoneEnableCard } from "./MicrophoneEnableCard";

const LiveExperienceShowcase = dynamic(
  () =>
    import("./LiveExperienceShowcase").then((m) => ({
      default: m.LiveExperienceShowcase,
    })),
  { ssr: false, loading: () => <ShowcasePlaceholder /> }
);

const PremiumFeatureCards = dynamic(
  () =>
    import("./PremiumFeatureCards").then((m) => ({
      default: m.PremiumFeatureCards,
    })),
  { ssr: false }
);

const SafetyNotice = dynamic(
  () =>
    import("./SafetyNotice").then((m) => ({ default: m.SafetyNotice })),
  { ssr: false }
);

function ShowcasePlaceholder() {
  return (
    <div
      className="live-showcase glass-panel-strong flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl p-4 text-center"
      aria-hidden
    >
      <div className="h-24 w-24 rounded-full bg-white/5" />
      <p className="mt-3 text-xs text-[#B0B8C8]">Loading preview…</p>
    </div>
  );
}

interface LandingPageProps {
  onStartWithSelectedInterests: (tags: string[]) => void;
  onQuickMatch: () => void;
  stats: PlatformStats | null;
  hasLiveStats: boolean;
  socketConnected: boolean;
  connectError?: string | null;
  micPermission: MicPermissionState;
  micReady: boolean;
  isRequestingMic: boolean;
  micError: MicError;
  onEnableMicrophone: () => void;
}

export function LandingPage({
  onStartWithSelectedInterests,
  onQuickMatch,
  stats,
  hasLiveStats,
  socketConnected,
  connectError,
  micPermission,
  micReady,
  isRequestingMic,
  micError,
  onEnableMicrophone,
}: LandingPageProps) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: 0.25 }}
    >
      <section
        className="landing-hero relative flex min-h-[calc(100dvh-4.25rem)] flex-col px-3 pb-3 pt-2 sm:min-h-[calc(100dvh-5rem)] sm:px-5 sm:pb-4 sm:pt-3"
        aria-label="Start a voice match"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FF00C2]/8 via-transparent to-transparent" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2 sm:gap-3">
        <header className="shrink-0 text-center lg:text-left">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2rem]">
              Talk to strangers.{" "}
              <span className="text-gradient-premium">Voice only.</span>
            </h1>
            <p className="mt-1 text-xs text-[#B0B8C8] sm:text-sm">
              Anonymous · No signup · Same steps on Vercel and localhost
            </p>
            <div className="mt-2 space-y-2">
              <EnvironmentNotice />
              <LiveActivityStrip
                variant="inline"
                stats={stats}
                hasLiveStats={hasLiveStats}
                socketConnected={socketConnected}
                connectError={connectError}
              />
            </div>
          </header>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-1 xl:gap-4">
            <div className="flex min-h-0 min-w-0 flex-col justify-center lg:max-h-[min(42dvh,380px)] xl:max-h-[min(36dvh,340px)]">
              <LiveExperienceShowcase
                variant="compact"
                socketConnected={socketConnected}
              />
            </div>

            <div className="flex min-h-0 min-w-0 flex-col gap-2 sm:gap-3">
              <MicrophoneEnableCard
                permission={micPermission}
                micReady={micReady}
                isRequesting={isRequestingMic}
                micError={micError}
                onEnable={onEnableMicrophone}
              />
              <InterestSelectionPanel
                selected={selected}
                onChange={setSelected}
                onStartWithInterests={onStartWithSelectedInterests}
                onQuickMatch={onQuickMatch}
                socketConnected={socketConnected}
                matchDisabled={!micReady || !socketConnected}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-white/8 px-3 py-6 sm:px-5 sm:py-8"
        aria-label="Platform features"
      >
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#B0B8C8]/80">
            Safer than classic random chat
          </p>
          <PremiumFeatureCards compact />
          <div className="mt-5">
            <SafetyNotice compact />
          </div>
        </div>
      </section>
    </motion.div>
  );
}
