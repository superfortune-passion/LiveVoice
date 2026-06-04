"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { closeSharedAudioContext } from "@/lib/audio-analyser";
import { isMicApiAvailable, isSecureContextForMic } from "@/lib/mic-access";
import {
  createLocalMonitorPipeline,
  type LocalMonitorPipeline,
} from "@/lib/audio-pipeline";
import { waitForIceGathering } from "@/lib/ice-gathering";
import { loadIceServers } from "@/lib/ice-servers";
import {
  getMusicianRtcConfiguration,
  MUSICIAN_AUDIO_CONSTRAINTS,
  preferLowLatencyOpus,
} from "@/lib/musician-webrtc";
import type {
  ClientToServerEvents,
  IceCandidatePayload,
  MatchedPayload,
  SdpPayload,
  ServerToClientEvents,
} from "@/types/socket";

export type MicError =
  | "denied"
  | "not-found"
  | "not-supported"
  | "insecure"
  | "unknown"
  | null;

interface UseWebRTCOptions {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  enabled: boolean;
}

function mapMediaError(err: unknown): MicError {
  if (err instanceof DOMException) {
    if (err.name === "SecurityError") {
      return "insecure";
    }
    if (err.name === "NotAllowedError") {
      return "denied";
    }
    if (err.name === "NotFoundError") return "not-found";
    if (err.name === "NotSupportedError") return "not-supported";
  }
  return "unknown";
}

function stopStreamTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => {
    t.stop();
  });
}

function closePeerConnection(pc: RTCPeerConnection): void {
  try {
    pc.getSenders().forEach((sender) => {
      try {
        pc.removeTrack(sender);
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
  pc.ontrack = null;
  pc.onicecandidate = null;
  pc.onconnectionstatechange = null;
  pc.oniceconnectionstatechange = null;
  pc.close();
}

export function useWebRTC({ socket, enabled }: UseWebRTCOptions) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const peerIdRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<SdpPayload | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isInitiatorRef = useRef(false);
  const iceRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iceStuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monitorPipelineRef = useRef<LocalMonitorPipeline | null>(null);
  const remoteVolumeRef = useRef(1);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [micError, setMicError] = useState<MicError>(null);
  const [rtcReady, setRtcReady] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [remoteAudioPlaying, setRemoteAudioPlaying] = useState(false);
  const [iceConnectionState, setIceConnectionState] =
    useState<RTCIceConnectionState>("new");

  const clearIceRestartTimer = useCallback(() => {
    if (iceRestartTimerRef.current) {
      clearTimeout(iceRestartTimerRef.current);
      iceRestartTimerRef.current = null;
    }
  }, []);

  const restartIce = useCallback(async () => {
    const pc = peerRef.current;
    if (!pc || makingOfferRef.current) return;
    if (
      pc.iceConnectionState === "connected" ||
      pc.iceConnectionState === "completed"
    ) {
      return;
    }

    makingOfferRef.current = true;
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);
      const sdp = pc.localDescription;
      if (sdp && isInitiatorRef.current) {
        socket?.emit("offer", { sdp });
      }
    } catch {
      /* ignore */
    } finally {
      makingOfferRef.current = false;
    }
  }, [socket]);

  const clearIceStuckTimer = useCallback(() => {
    if (iceStuckTimerRef.current) {
      clearTimeout(iceStuckTimerRef.current);
      iceStuckTimerRef.current = null;
    }
  }, []);

  const scheduleIceStuckRecovery = useCallback(() => {
    clearIceStuckTimer();
    iceStuckTimerRef.current = setTimeout(() => {
      const pc = peerRef.current;
      if (!pc) return;
      const s = pc.iceConnectionState;
      if (s === "checking" || s === "new" || s === "disconnected") {
        if (isInitiatorRef.current) void restartIce();
      }
    }, 8000);
  }, [clearIceStuckTimer, restartIce]);

  const scheduleIceRestart = useCallback(() => {
    clearIceRestartTimer();
    iceRestartTimerRef.current = setTimeout(() => {
      void restartIce();
    }, 4000);
  }, [clearIceRestartTimer, restartIce]);

  const syncRemotePlaybackState = useCallback(() => {
    const el = remoteAudioRef.current;
    const playing =
      !!el &&
      !el.paused &&
      !el.ended &&
      el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    setRemoteAudioPlaying(playing);
    if (playing) {
      setNeedsAudioUnlock(false);
    }
  }, []);

  const attachRemotePlayback = useCallback(async () => {
    const el = remoteAudioRef.current;
    const stream = remoteStreamRef.current;
    if (!el || !stream) return false;
    el.srcObject = stream;
    el.volume = remoteVolumeRef.current;
    el.muted = false;
    setNeedsAudioUnlock(true);
    try {
      await el.play();
      syncRemotePlaybackState();
      return true;
    } catch {
      setRemoteAudioPlaying(false);
      return false;
    }
  }, [syncRemotePlaybackState]);

  const releaseRemoteStream = useCallback(() => {
    stopStreamTracks(remoteStreamRef.current);
    remoteStreamRef.current = null;
    setRemoteStream(null);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
  }, []);

  const teardownPeer = useCallback(() => {
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    clearIceRestartTimer();
    clearIceStuckTimer();
    isInitiatorRef.current = false;

    if (peerRef.current) {
      closePeerConnection(peerRef.current);
      peerRef.current = null;
    }

    releaseRemoteStream();
    peerIdRef.current = null;
    setRtcReady(false);
    setNeedsAudioUnlock(false);
    setRemoteAudioPlaying(false);
    setIceConnectionState("new");
  }, [releaseRemoteStream, clearIceRestartTimer, clearIceStuckTimer]);

  const disposeMonitorPipeline = useCallback(() => {
    monitorPipelineRef.current?.dispose();
    monitorPipelineRef.current = null;
  }, []);

  const stopLocalTracks = useCallback(() => {
    stopStreamTracks(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
    setIsMuted(false);
    disposeMonitorPipeline();
  }, [disposeMonitorPipeline]);

  const fullCleanup = useCallback(() => {
    teardownPeer();
    stopLocalTracks();
    disposeMonitorPipeline();
    setMicError(null);
    closeSharedAudioContext();
  }, [teardownPeer, stopLocalTracks, disposeMonitorPipeline]);

  const requestMicrophone = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current?.active) {
      return localStreamRef.current;
    }

    if (!isMicApiAvailable()) {
      setMicError("not-supported");
      return null;
    }

    if (!isSecureContextForMic()) {
      setMicError("insecure");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        MUSICIAN_AUDIO_CONSTRAINTS
      );
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicError(null);
      setIsMuted(false);

      disposeMonitorPipeline();
      const pipeline = await createLocalMonitorPipeline(stream);
      monitorPipelineRef.current = pipeline;

      return stream;
    } catch (err) {
      setMicError(mapMediaError(err));
      return null;
    }
  }, [disposeMonitorPipeline]);

  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    for (const c of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        /* stale */
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  const createPeerConnection = useCallback(
    async (stream: MediaStream, peerId: string) => {
      if (peerRef.current) {
        teardownPeer();
      }

      const iceServers = await loadIceServers();
      const pc = new RTCPeerConnection(getMusicianRtcConfiguration(iceServers));
      stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      preferLowLatencyOpus(pc);

      pc.ontrack = (event) => {
        let incoming = event.streams[0];
        if (!incoming) {
          incoming = new MediaStream();
          incoming.addTrack(event.track);
        }
        stopStreamTracks(remoteStreamRef.current);
        remoteStreamRef.current = incoming;
        setRemoteStream(incoming);
        setRtcReady(true);
        void attachRemotePlayback();
      };

      pc.onicecandidate = (event) => {
        if (!socket?.connected || !peerIdRef.current || !event.candidate) return;
        socket.emit("ice-candidate", {
          candidate: event.candidate.toJSON(),
        });
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "failed") {
          void restartIce();
          return;
        }
        if (state === "closed") {
          teardownPeer();
        }
      };

      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        setIceConnectionState(iceState);

        if (iceState === "connected" || iceState === "completed") {
          clearIceRestartTimer();
          clearIceStuckTimer();
          return;
        }

        if (iceState === "failed") {
          void restartIce();
          return;
        }

        if (iceState === "disconnected") {
          scheduleIceRestart();
        }
      };

      peerRef.current = pc;
      peerIdRef.current = peerId;
      scheduleIceStuckRecovery();
      return pc;
    },
    [
      socket,
      attachRemotePlayback,
      teardownPeer,
      clearIceRestartTimer,
      clearIceStuckTimer,
      restartIce,
      scheduleIceRestart,
      scheduleIceStuckRecovery,
    ]
  );

  const isFromCurrentPeer = useCallback((from: string) => {
    return peerIdRef.current === from;
  }, []);

  const applyOffer = useCallback(
    async (payload: SdpPayload, stream: MediaStream) => {
      if (!isFromCurrentPeer(payload.from)) return;

      let pc = peerRef.current;
      if (!pc) {
        pc = await createPeerConnection(stream, payload.from);
      }

      const polite = !makingOfferRef.current;
      const offerCollision =
        makingOfferRef.current || pc.signalingState !== "stable";

      if (offerCollision) {
        if (!polite) return;
        ignoreOfferRef.current = true;
        try {
          await pc.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit);
        } catch {
          teardownPeer();
          return;
        }
      }

      try {
        ignoreOfferRef.current = false;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushPendingCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceGathering(pc);
        const local = pc.localDescription;
        if (local) socket?.emit("answer", { sdp: local });
      } catch {
        teardownPeer();
      }
    },
    [
      createPeerConnection,
      flushPendingCandidates,
      isFromCurrentPeer,
      socket,
      teardownPeer,
    ]
  );

  const processPendingOffer = useCallback(
    async (stream: MediaStream) => {
      const pending = pendingOfferRef.current;
      if (pending && peerIdRef.current === pending.from) {
        pendingOfferRef.current = null;
        await applyOffer(pending, stream);
      }
    },
    [applyOffer]
  );

  const handleMatched = useCallback(
    async (payload: MatchedPayload) => {
      if (peerIdRef.current && peerIdRef.current !== payload.peerId) {
        teardownPeer();
      }

      const stream = localStreamRef.current ?? (await requestMicrophone());
      if (!stream) return;

      peerIdRef.current = payload.peerId;
      setIsMuted(false);
      isInitiatorRef.current = payload.isInitiator;

      if (payload.isInitiator) {
        const pc = await createPeerConnection(stream, payload.peerId);
        makingOfferRef.current = true;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await waitForIceGathering(pc);
          const local = pc.localDescription;
          if (local) socket?.emit("offer", { sdp: local });
        } catch {
          teardownPeer();
        } finally {
          makingOfferRef.current = false;
        }
      } else {
        if (!peerRef.current) {
          await createPeerConnection(stream, payload.peerId);
        }
        await processPendingOffer(stream);
      }
    },
    [
      teardownPeer,
      requestMicrophone,
      createPeerConnection,
      socket,
      processPendingOffer,
    ]
  );

  const handleOffer = useCallback(
    async (payload: SdpPayload) => {
      if (peerIdRef.current && !isFromCurrentPeer(payload.from)) return;

      const stream = localStreamRef.current ?? (await requestMicrophone());
      if (!stream) return;

      if (!peerIdRef.current) {
        peerIdRef.current = payload.from;
      }
      if (!peerRef.current) {
        await createPeerConnection(stream, payload.from);
      }

      await applyOffer(payload, stream);
    },
    [
      isFromCurrentPeer,
      requestMicrophone,
      createPeerConnection,
      applyOffer,
    ]
  );

  const handleAnswer = useCallback(
    async (payload: SdpPayload) => {
      if (!isFromCurrentPeer(payload.from)) return;
      const pc = peerRef.current;
      if (!pc || ignoreOfferRef.current) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushPendingCandidates(pc);
      } catch {
        teardownPeer();
      }
    },
    [isFromCurrentPeer, flushPendingCandidates, teardownPeer]
  );

  const handleIceCandidate = useCallback(
    async (payload: IceCandidatePayload) => {
      if (!isFromCurrentPeer(payload.from)) return;
      const pc = peerRef.current;
      if (!pc?.remoteDescription) {
        pendingCandidatesRef.current.push(payload.candidate);
        return;
      }
      if (!payload.candidate.candidate) {
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch {
        /* ignore */
      }
    },
    [isFromCurrentPeer]
  );

  const handlersRef = useRef({
    handleMatched,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  });

  useEffect(() => {
    handlersRef.current = {
      handleMatched,
      handleOffer,
      handleAnswer,
      handleIceCandidate,
    };
  });

  const toggleMute = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    setIsMuted((prev) => {
      const next = !prev;
      tracks.forEach((t) => {
        t.enabled = !next;
      });
      return next;
    });
  }, []);

  const unlockRemoteAudio = useCallback(async () => {
    return attachRemotePlayback();
  }, [attachRemotePlayback]);

  const setRemoteAudioElement = useCallback(
    (el: HTMLAudioElement | null) => {
      const prev = remoteAudioRef.current;
      if (prev) {
        prev.onplaying = null;
        prev.onpause = null;
        prev.onended = null;
        prev.onemptied = null;
      }

      remoteAudioRef.current = el;
      if (!el) return;

      const onPlaybackChange = () => syncRemotePlaybackState();
      el.onplaying = onPlaybackChange;
      el.onpause = onPlaybackChange;
      el.onended = onPlaybackChange;
      el.onemptied = onPlaybackChange;

      if (remoteStreamRef.current) {
        void attachRemotePlayback();
      }
    },
    [attachRemotePlayback, syncRemotePlaybackState]
  );

  const prepareForCall = useCallback(async () => {
    return requestMicrophone();
  }, [requestMicrophone]);

  /** Call directly from a click/tap handler so the browser shows the mic prompt. */
  const requestMicrophoneFromGesture = requestMicrophone;

  const endPeerOnly = useCallback(() => {
    teardownPeer();
  }, [teardownPeer]);

  const getPeerConnection = useCallback(() => peerRef.current, []);

  const setRemoteVolume = useCallback((level: number) => {
    const clamped = Math.min(1, Math.max(0, level));
    remoteVolumeRef.current = clamped;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = clamped;
    }
  }, []);

  const setInputGain = useCallback((level: number) => {
    const clamped = Math.min(2, Math.max(0, level));
    if (monitorPipelineRef.current?.gain) {
      monitorPipelineRef.current.gain.gain.value = clamped;
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onMatched = (p: MatchedPayload) => {
      void handlersRef.current.handleMatched(p);
    };
    const onOffer = (p: SdpPayload) => {
      void handlersRef.current.handleOffer(p);
    };
    const onAnswer = (p: SdpPayload) => {
      void handlersRef.current.handleAnswer(p);
    };
    const onIce = (p: IceCandidatePayload) => {
      void handlersRef.current.handleIceCandidate(p);
    };

    socket.on("matched", onMatched);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);

    return () => {
      socket.off("matched", onMatched);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
    };
  }, [socket]);

  const retryVoiceLink = useCallback(async () => {
    await restartIce();
  }, [restartIce]);

  useEffect(() => {
    if (!enabled) return;
    void loadIceServers();
    return () => {
      teardownPeer();
    };
  }, [enabled, teardownPeer]);

  /** First tap anywhere in the call unlocks speaker output (browser autoplay rule). */
  useEffect(() => {
    if (!needsAudioUnlock || !remoteStream) return;

    const unlockFromGesture = () => {
      void attachRemotePlayback();
    };

    document.addEventListener("pointerdown", unlockFromGesture, {
      capture: true,
      once: true,
    });
    return () => {
      document.removeEventListener("pointerdown", unlockFromGesture, {
        capture: true,
      });
    };
  }, [needsAudioUnlock, remoteStream, attachRemotePlayback]);

  useEffect(() => {
    return () => {
      fullCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  return {
    localStream,
    remoteStream,
    isMuted,
    micError,
    rtcReady,
    needsAudioUnlock,
    remoteAudioPlaying,
    iceConnectionState,
    toggleMute,
    setRemoteAudioElement,
    prepareForCall,
    requestMicrophone,
    requestMicrophoneFromGesture,
    unlockRemoteAudio,
    retryVoiceLink,
    cleanup: fullCleanup,
    endPeerOnly,
    getPeerConnection,
    setRemoteVolume,
    setInputGain,
  };
}
