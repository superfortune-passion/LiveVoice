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
import { SessionAlert } from "./SessionAlert";

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

  const needsMicPermission =
    !localStream?.active &&
    (status === "connected" ||
      status === "searching" ||
      phase === "connecting");

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
      <audio
        ref={setRemoteAudioElement}
        autoPlay
        playsInline
        className="sr-only"
        aria-label="Remote participant audio"
      />
      <audio ref={localPreviewRef} playsInline muted className="sr-only" />

      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col gap-4 pb-[max(6rem,env(safe-area-inset-bottom))] sm:gap-5">
        {needsMicPermission && (
          <SessionAlert
            variant="warning"
            title="Microphone permission needed"
            action={{ label: "Allow microphone", onClick: onRetryMic }}
          >
            Tap the button above — your browser will ask to use the mic. This
            is not the Report button at the bottom (Report is only for abuse).
          </SessionAlert>
        )}

        {showVoicePathHelp && (
          <SessionAlert
            variant="error"
            title="Partner voice not connected yet"
            action={{ label: "Skip — try someone new", onClick: handleSkip }}
          >
            <p>
              Your mic can work while the voice link is still opening. Wait a
              few seconds, or tap Skip. Report does not fix audio or
              permissions.
            </p>
            <p className="mt-2">
              Both people must allow the microphone on the home page before
              matching.
            </p>
          </SessionAlert>
        )}

        {showHearPartnerHint && (
          <SessionAlert
            variant="warning"
            title="Tap to hear your partner"
            action={{ label: "Enable speaker audio", onClick: handleUnlockAudio }}
          >
            Browsers block speaker audio until you tap. Use this yellow alert —
            not the red Report abuse button below.
          </SessionAlert>
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

        {phase === "connected" &&
          remoteStream &&
          !remoteSpeaking &&
          remoteAudioPlaying &&
          !isMuted && (
            <p className="text-center text-xs text-[#B0B8C8]">
              Partner&apos;s line is quiet — they may need Allow microphone or
              Tap to hear on their side.
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
