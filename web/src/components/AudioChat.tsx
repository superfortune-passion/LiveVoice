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

  const phase = useAppPhase({
    inSession: true,
    connectionStatus: status,
    micError,
    hasLocalStream: !!localStream,
    rtcReady,
    isRequestingMic,
  });

  const callSeconds = useCallTimer(phase === "connected");
  const connectionQuality = useConnectionQuality(
    getPeerConnection,
    phase === "connected"
  );
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
      <audio
        ref={setRemoteAudioElement}
        autoPlay
        playsInline
        className="sr-only"
        aria-label="Remote participant audio"
      />
      <audio ref={localPreviewRef} playsInline muted className="sr-only" />

      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col gap-6 pb-[max(6rem,env(safe-area-inset-bottom))]">
        {needsAudioUnlock && phase === "connected" && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onUnlockAudio}
            className="glass-panel w-full rounded-2xl border border-amber-500/30 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-500/10"
          >
            Tap to enable partner audio
          </motion.button>
        )}

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

        <div className="sticky bottom-4 z-20 mt-auto sm:bottom-6">
          <CallControls
            isMuted={isMuted}
            canSkip={canSkip}
            canReport={canReport}
            hasLocalStream={!!localStream}
            onToggleMute={onToggleMute}
            onSkip={onSkip}
            onReport={onReport}
            onEnd={onEnd}
          />
        </div>
      </div>
    </motion.section>
  );
});
