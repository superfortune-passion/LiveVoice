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
  const micAutoRequestedRef = useRef(false);
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
    if (localStream?.active || micAutoRequestedRef.current) return;
    if (status !== "connected" && status !== "searching") return;
    micAutoRequestedRef.current = true;
    onRetryMic();
  }, [localStream, status, onRetryMic]);

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

      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col gap-4 pb-[max(6rem,env(safe-area-inset-bottom))] sm:gap-5">
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

        {phase === "connecting" && status === "connected" && (
          <p className="text-center text-xs text-[#B0B8C8]">
            Opening voice automatically — no extra taps needed.
          </p>
        )}

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
