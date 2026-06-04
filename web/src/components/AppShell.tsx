"use client";

import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeInterestList } from "@/lib/interests";
import { useAppPhase } from "@/hooks/useAppPhase";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useMicPermission } from "@/hooks/useMicPermission";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useWebRTC } from "@/hooks/useWebRTC";
import { AmbientBackground } from "./AmbientBackground";
import { LandingPage } from "./LandingPage";
import { Navbar } from "./Navbar";
import { StatusToast } from "./StatusToast";

const AudioChat = dynamic(
  () => import("./AudioChat").then((m) => ({ default: m.AudioChat })),
  { ssr: false }
);

const ReportModal = dynamic(
  () => import("./ReportModal").then((m) => ({ default: m.ReportModal })),
  { ssr: false }
);

type View = "landing" | "session";

export function AppShell() {
  const [view, setView] = useState<View>("landing");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const pendingSearchRef = useRef<string[] | null>(null);
  /** Match clicked before mic ready — start session once stream is active. */
  const pendingLandingMatchRef = useRef<string[] | null>(null);
  const autoRequeueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef = useRef<string>("idle");

  const micPermission = useMicPermission();

  const { stats, hasLiveStats, networkOnly, socketConnected, connectError } =
    usePlatformStats();

  const {
    status,
    peerId: matchedPeerId,
    interests,
    sharedInterests,
    messages,
    startSearch,
    skip,
    stopSearch,
    reportUser,
    dismissMessage,
    socket,
  } = useMatchmaking();

  const {
    localStream,
    remoteStream,
    isMuted,
    micError,
    rtcReady,
    needsAudioUnlock,
    toggleMute,
    setRemoteAudioElement,
    requestMicrophoneFromGesture,
    unlockRemoteAudio,
    cleanup,
    endPeerOnly,
    getPeerConnection,
  } = useWebRTC({ socket: socket ?? null, enabled: !!socket });

  const micReady = !!localStream?.active;

  const sessionPhase = useAppPhase({
    inSession: view === "session",
    connectionStatus: status,
    micError,
    hasLocalStream: micReady,
    rtcReady,
    isRequestingMic,
  });

  const clearAutoRequeue = useCallback(() => {
    if (autoRequeueTimerRef.current) {
      clearTimeout(autoRequeueTimerRef.current);
      autoRequeueTimerRef.current = null;
    }
  }, []);

  /** Returning users: permission already granted — acquire stream without extra UI step. */
  useEffect(() => {
    if (view !== "landing" || micReady) return;
    if (micPermission !== "granted") return;
    void requestMicrophoneFromGesture();
  }, [view, micReady, micPermission, requestMicrophoneFromGesture]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (view !== "session") return;

    if (prev === "connected" && status === "disconnected") {
      endPeerOnly();
      clearAutoRequeue();
      autoRequeueTimerRef.current = setTimeout(() => {
        startSearch(interests);
      }, 1500);
    } else if (
      (prev === "connected" && status === "searching") ||
      (prev === "connecting" && status === "searching")
    ) {
      endPeerOnly();
      clearAutoRequeue();
    }

    return () => clearAutoRequeue();
  }, [status, view, interests, endPeerOnly, startSearch, clearAutoRequeue]);

  useEffect(() => {
    if (view !== "session" || pendingSearchRef.current === null || !micReady) {
      return;
    }
    const tags = pendingSearchRef.current;
    pendingSearchRef.current = null;
    startSearch(tags);
  }, [view, micReady, startSearch]);

  const handleEnableMicrophone = useCallback(() => {
    setIsRequestingMic(true);
    void requestMicrophoneFromGesture().finally(() => {
      setIsRequestingMic(false);
    });
  }, [requestMicrophoneFromGesture]);

  const beginSession = useCallback(
    (rawTags: string[]) => {
      const tags = sanitizeInterestList(rawTags);

      if (!micReady) {
        pendingLandingMatchRef.current = tags;
        handleEnableMicrophone();
        return;
      }

      pendingSearchRef.current = tags;
      setView("session");
    },
    [micReady, handleEnableMicrophone]
  );

  useEffect(() => {
    if (view !== "landing" || !micReady) return;
    const tags = pendingLandingMatchRef.current;
    if (tags === null) return;
    pendingLandingMatchRef.current = null;
    pendingSearchRef.current = tags;
    setView("session");
  }, [view, micReady]);

  const handleQuickMatch = useCallback(() => {
    beginSession([]);
  }, [beginSession]);

  const handleStartWithInterests = useCallback(
    (tags: string[]) => {
      beginSession(tags);
    },
    [beginSession]
  );

  const handleRetryMic = useCallback(() => {
    setIsRequestingMic(true);
    void requestMicrophoneFromGesture().finally(() => {
      setIsRequestingMic(false);
      if (view === "session" && micReady && pendingSearchRef.current === null) {
        startSearch(interests);
      }
    });
  }, [
    requestMicrophoneFromGesture,
    view,
    micReady,
    interests,
    startSearch,
  ]);

  const handleSkip = useCallback(() => {
    endPeerOnly();
    skip();
  }, [endPeerOnly, skip]);

  const handleEnd = useCallback(() => {
    clearAutoRequeue();
    endPeerOnly();
    stopSearch();
    cleanup();
    pendingSearchRef.current = null;
    pendingLandingMatchRef.current = null;
    setView("landing");
    setReportOpen(false);
  }, [clearAutoRequeue, endPeerOnly, stopSearch, cleanup]);

  const handleOpenReport = useCallback(() => setReportOpen(true), []);
  const handleCloseReport = useCallback(() => setReportOpen(false), []);

  const handleReportSubmit = useCallback(
    (reason: Parameters<typeof reportUser>[0]) => {
      setReportSubmitting(true);
      reportUser(reason);
      setReportOpen(false);
      setReportSubmitting(false);
    },
    [reportUser]
  );

  useEffect(() => {
    if (view === "landing") clearAutoRequeue();
  }, [view, clearAutoRequeue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && view === "session") handleEnd();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, handleEnd]);

  const inSession = view === "session";

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden">
      <AmbientBackground intensity={inSession ? "high" : "low"} />

      <Navbar
        mode={inSession ? "session" : "landing"}
        socketConnected={socketConnected}
        sessionPhase={inSession ? sessionPhase : "idle"}
        stats={stats}
        hasLiveStats={hasLiveStats}
        networkOnly={networkOnly}
        onEnd={inSession ? handleEnd : undefined}
      />

      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {!inSession ? (
            <LandingPage
              key="landing"
              onStartWithSelectedInterests={handleStartWithInterests}
              onQuickMatch={handleQuickMatch}
              stats={stats}
              hasLiveStats={hasLiveStats}
              socketConnected={socketConnected}
              connectError={connectError}
              micPermission={micPermission}
              micReady={micReady}
              isRequestingMic={isRequestingMic}
              micError={micError}
              onEnableMicrophone={handleEnableMicrophone}
            />
          ) : (
            <AudioChat
              key="chat"
              status={status}
              peerId={matchedPeerId}
              sharedInterests={sharedInterests}
              localStream={localStream}
              remoteStream={remoteStream}
              isMuted={isMuted}
              micError={micError}
              rtcReady={rtcReady}
              isRequestingMic={isRequestingMic}
              needsAudioUnlock={needsAudioUnlock}
              onToggleMute={toggleMute}
              onSkip={handleSkip}
              onEnd={handleEnd}
              onReport={handleOpenReport}
              onUnlockAudio={unlockRemoteAudio}
              onRetryMic={handleRetryMic}
              setRemoteAudioElement={setRemoteAudioElement}
              getPeerConnection={getPeerConnection}
            />
          )}
        </AnimatePresence>
      </main>

      <ReportModal
        open={reportOpen}
        onClose={handleCloseReport}
        onSubmit={handleReportSubmit}
        submitting={reportSubmitting}
      />

      <StatusToast messages={messages} onDismiss={dismissMessage} />
    </div>
  );
}
