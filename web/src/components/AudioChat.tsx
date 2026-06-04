"use client";

import { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAppPhase, micErrorMessage } from "@/hooks/useAppPhase";
import { useCallTimer } from "@/hooks/useCallTimer";
import { useConnectionQuality } from "@/hooks/useConnectionQuality";
import { useVoiceActivity } from "@/hooks/useVoiceActivity";
import type { MicError } from "@/hooks/useWebRTC";
import type { ConnectionStatus } from "@/types/socket";
import { fadeSlide } from "@/lib/motion";
import { CallControls } from "./CallControls";
import { MatchStateCard } from "./MatchStateCard";

interface AudioChatProps {
  status: ConnectionStatus;
  peerId: string | null;
  sharedInterests: string[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  micError: MicError;
  rtcReady: boolean;
  isRequestingMic: boolean;
  needsAudioUnlock: boolean;
  remoteAudioPlaying: boolean;
  iceConnectionState: RTCIceConnectionState;
  onToggleMute: () => void;
  onSkip: () => void;
  onEnd: () => void;
  onReport: () => void;
  onUnlockAudio: () => void;
  onRetryMic: () => void;
  setRemoteAudioElement: (el: HTMLAudioElement | null) => void;
  getPeerConnection: () => RTCPeerConnection | null;
}

export const AudioChat = memo(function AudioChat({
  status,
  peerId,
  sharedInterests,
  localStream,
  remoteStream,
  isMuted,
  micError,
  rtcReady,
  isRequestingMic,
  needsAudioUnlock,
  remoteAudioPlaying,
  iceConnectionState,
  onToggleMute,
  onSkip,
  onEnd,
  onReport,
  onUnlockAudio,
  onRetryMic,
  setRemoteAudioElement,
  getPeerConnection,
}: AudioChatProps) {
  const localPreviewRef = useRef<HTMLAudioElement>(null);
  const localSpeaking = useVoiceActivity(localStream);
  const remoteSpeaking = useVoiceActivity(remoteStream);

  const voiceLinkReady =
    iceConnectionState === "connected" ||
    iceConnectionState === "completed";

  const phase = useAppPhase({
    inSession: true,
    connectionStatus: status,
    micError,
    hasLocalStream: !!localStream,
    rtcReady,
    voiceLinkReady,
    isRequestingMic,
  });

  const callSeconds = useCallTimer(status === "connected");
  const connectionQuality = useConnectionQuality(
    getPeerConnection,
    status === "connected"
  );
  const showHearPartnerHint =
    !!remoteStream &&
    voiceLinkReady &&
    phase === "connected" &&
    (!remoteAudioPlaying || needsAudioUnlock);

  const showVoicePathHelp =
    status === "connected" &&
    callSeconds >= 6 &&
    !voiceLinkReady &&
    phase === "connecting";

  const handleUnlockAudio = () => {
    void onUnlockAudio();
  };

  const handleToggleMute = () => {
    void onUnlockAudio();
    onToggleMute();
  };

  const handleSkip = () => {
    void onUnlockAudio();
    onSkip();
  };

  const canSkip =
    phase === "connected" ||
    phase === "connecting" ||
    phase === "searching" ||
    phase === "peer_disconnected";
  const canReport = phase === "connected" || phase === "connecting";
  const activeStream =
    phase === "connected" ? remoteStream ?? localStream : localStream;

  useEffect(() => {
    const el = localPreviewRef.current;
    if (!el) return;
    if (localStream) {
      el.srcObject = localStream;
      el.muted = true;
      void el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [localStream]);

  return (
    <motion.section
      className="relative flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-8"
      {...fadeSlide}
      aria-label="Voice chat session"
    >
      {showVoicePathHelp && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed left-1/2 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] z-[60] w-[min(calc(100%-2rem),26rem)] -translate-x-1/2 rounded-2xl border border-rose-400/50 bg-rose-950/90 px-4 py-3 text-center"
        >
          <p className="text-sm font-bold text-rose-100">
            No voice from partner yet
          </p>
          <p className="mt-1 text-xs leading-relaxed text-rose-100/85">
            This is a network issue, not microphone permission. The red Report
            button does not fix audio. Both sides need mic allowed; voice uses
            a relay through the internet.
          </p>
          <p className="mt-2 text-xs text-rose-200/70">
            Try Skip for a new match, or redeploy with the latest app build.
          </p>
        </motion.div>
      )}

      {showHearPartnerHint && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUnlockAudio}
          className="fixed left-1/2 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] z-[60] w-[min(calc(100%-2rem),24rem)] -translate-x-1/2 rounded-2xl border-2 border-amber-400 bg-amber-500 px-4 py-3 text-center shadow-[0_8px_32px_-4px_rgba(245,158,11,0.65)]"
        >
          <p className="text-sm font-bold text-amber-950 sm:text-base">
            Tap here to hear your partner
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-amber-950/80 sm:text-xs">
            Yellow bar at top — not the red Report button below
          </p>
        </motion.button>
      )}

      <audio
        ref={setRemoteAudioElement}
        autoPlay
        playsInline
        className="sr-only"
        aria-label="Remote participant audio"
      />
      <audio ref={localPreviewRef} playsInline muted className="sr-only" />

      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col gap-6 pb-[max(6rem,env(safe-area-inset-bottom))]">
        <MatchStateCard
          phase={phase}
          micError={micError}
          callSeconds={callSeconds}
          peerId={peerId}
          connectionQuality={connectionQuality}
          sharedInterests={sharedInterests}
          localSpeaking={localSpeaking}
          remoteSpeaking={remoteSpeaking}
          isMuted={isMuted}
          stream={activeStream}
          localStream={localStream}
          remoteStream={remoteStream}
          onRetryMic={onRetryMic}
          variant="session"
        />

        {phase === "error" && micErrorMessage(micError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-rose-500/25 bg-rose-950/50 px-4 py-3 text-center text-sm text-rose-100"
            role="alert"
          >
            {micErrorMessage(micError)}
          </motion.div>
        )}

        {phase === "connected" &&
          remoteStream &&
          !remoteSpeaking &&
          remoteAudioPlaying &&
          !isMuted && (
            <p className="text-center text-xs text-[#B0B8C8]">
              Partner&apos;s line is quiet — they may still need to allow the
              microphone or tap to hear you on their side.
            </p>
          )}

        <div className="sticky bottom-4 z-20 mt-auto sm:bottom-6">
          <CallControls
            isMuted={isMuted}
            canSkip={canSkip}
            canReport={canReport}
            hasLocalStream={!!localStream}
            onToggleMute={handleToggleMute}
            onSkip={handleSkip}
            onReport={onReport}
            onEnd={onEnd}
          />
        </div>
      </div>
    </motion.section>
  );
});
