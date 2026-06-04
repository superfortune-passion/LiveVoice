"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { scheduleAfterPaint } from "@/lib/schedule-client-work";
import { getSocket } from "@/lib/socket";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";
import { createThrottle } from "@/lib/throttle";
import type {
  ConnectionStatus,
  PeerDisconnectedPayload,
  ReportReason,
  StatusMessage,
} from "@/types/socket";

function createMessage(
  type: StatusMessage["type"],
  text: string
): StatusMessage {
  return { id: `${Date.now()}-${Math.random()}`, type, text };
}

const throttleSkip = createThrottle(700);
const throttleSearch = createThrottle(1000);

export function useMatchmaking() {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const interestsRef = useRef<string[]>([]);
  const pendingSearchRef = useRef<string[] | null>(null);
  const wasSearchingRef = useRef(false);
  const disconnectIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const hasShownServerConnectRef = useRef(false);

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [messages, setMessages] = useState<StatusMessage[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [sharedInterests, setSharedInterests] = useState<string[]>([]);

  const clearDisconnectIdleTimer = useCallback(() => {
    if (disconnectIdleTimerRef.current) {
      clearTimeout(disconnectIdleTimerRef.current);
      disconnectIdleTimerRef.current = null;
    }
  }, []);

  const pushMessage = useCallback(
    (type: StatusMessage["type"], text: string, replace = false) => {
      setMessages((prev) => {
        if (replace) return [createMessage(type, text)];
        const next = [...prev, createMessage(type, text)];
        return next.slice(-2);
      });
    },
    []
  );

  const dismissMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  useEffect(() => {
    return scheduleAfterPaint(() => setSocket(getSocket()));
  }, []);

  const emitStartSearch = useCallback(
    (tags: string[]) => {
      if (!socket?.connected) {
        pendingSearchRef.current = tags;
        return false;
      }
      pendingSearchRef.current = null;
      socket.emit("start-search", { interests: tags });
      return true;
    },
    [socket]
  );

  const startSearch = useCallback(
    (tags: string[]) => {
      if (!throttleSearch()) {
        pushMessage("warning", "Please wait before searching again.");
        return;
      }
      if (!socket?.connected) {
        pendingSearchRef.current = tags;
        interestsRef.current = tags;
        setInterests(tags);
        pushMessage(
          "error",
          "Not connected to the matchmaking server. Check that signaling is running (local: npm run dev) or set NEXT_PUBLIC_SOCKET_URL on Vercel."
        );
        return;
      }
      clearDisconnectIdleTimer();
      interestsRef.current = tags;
      setInterests(tags);
      setPeerId(null);
      setStatus("searching");
      wasSearchingRef.current = true;
      pushMessage("info", "Looking for someone to talk with…", true);
      emitStartSearch(tags);
    },
    [socket, pushMessage, clearDisconnectIdleTimer, emitStartSearch]
  );

  const skip = useCallback(() => {
    if (!socket?.connected) return;
    if (!throttleSkip()) {
      pushMessage("warning", "Please wait before skipping again.");
      return;
    }
    clearDisconnectIdleTimer();
    pushMessage("info", "Skipping — finding a new match…");
    setPeerId(null);
    setStatus("searching");
    wasSearchingRef.current = true;
    socket.emit("skip");
  }, [socket, pushMessage, clearDisconnectIdleTimer]);

  const stopSearch = useCallback(() => {
    if (!socket) return;
    clearDisconnectIdleTimer();
    wasSearchingRef.current = false;
    socket.emit("stop-search");
    setStatus("idle");
    setPeerId(null);
    pushMessage("info", "Session ended.");
  }, [socket, pushMessage, clearDisconnectIdleTimer]);

  const reportUser = useCallback(
    (reason: ReportReason) => {
      socket?.emit("report", { reason });
      pushMessage("info", "Sending report…");
    },
    [socket, pushMessage]
  );

  useEffect(() => {
    if (!socket) return;

    const onSearching = () => {
      clearDisconnectIdleTimer();
      setStatus("searching");
      setPeerId(null);
      wasSearchingRef.current = true;
    };

    const onMatched = (payload: {
      peerId: string;
      sharedInterests?: string[];
    }) => {
      clearDisconnectIdleTimer();
      setPeerId(payload.peerId);
      setStatus("connected");
      setSharedInterests(payload.sharedInterests ?? []);
      wasSearchingRef.current = false;
      pushMessage("success", "Connected! Say hello.", true);
    };

    const onPeerDisconnected = (payload: PeerDisconnectedPayload) => {
      clearDisconnectIdleTimer();
      setPeerId(null);
      setSharedInterests([]);
      setStatus("disconnected");
      const text =
        payload.message ??
        (payload.reason === "skip"
          ? "Partner skipped."
          : "Partner disconnected.");
      pushMessage("warning", text);

      disconnectIdleTimerRef.current = setTimeout(() => {
        setStatus((s) => (s === "disconnected" ? "idle" : s));
      }, 3000);
    };

    const onConnect = () => {
      if (!hasShownServerConnectRef.current) {
        hasShownServerConnectRef.current = true;
        pushMessage("success", "Connected to server.", true);
      } else {
        pushMessage("info", "Reconnected — resuming search…");
      }

      const pending = pendingSearchRef.current;
      if (pending !== null) {
        pendingSearchRef.current = null;
        interestsRef.current = pending;
        setInterests(pending);
        setStatus("searching");
        wasSearchingRef.current = true;
        socket.emit("start-search", { interests: pending });
        pushMessage("info", "Looking for someone to talk with…", true);
        return;
      }

      if (wasSearchingRef.current) {
        emitStartSearch(interestsRef.current);
      }
    };

    const onDisconnect = () => {
      clearDisconnectIdleTimer();
      setStatus("error");
      setPeerId(null);
      pushMessage("error", "Lost connection to server. Reconnecting…");
    };

    const onRateLimited = (payload: { message: string }) => {
      pushMessage("warning", payload.message);
    };

    const onReportReceived = (payload: { message: string }) => {
      pushMessage("success", payload.message);
    };

    const onSessionEnded = () => {
      wasSearchingRef.current = false;
      setStatus("idle");
      setPeerId(null);
    };

    if (socket.connected) onConnect();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("searching", onSearching);
    socket.on("matched", onMatched);
    socket.on("peer-disconnected", onPeerDisconnected);
    socket.on("rate-limited", onRateLimited);
    socket.on("report-received", onReportReceived);
    socket.on("session-ended", onSessionEnded);

    return () => {
      clearDisconnectIdleTimer();
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("searching", onSearching);
      socket.off("matched", onMatched);
      socket.off("peer-disconnected", onPeerDisconnected);
      socket.off("rate-limited", onRateLimited);
      socket.off("report-received", onReportReceived);
      socket.off("session-ended", onSessionEnded);
    };
  }, [socket, pushMessage, clearDisconnectIdleTimer, emitStartSearch]);

  useEffect(() => {
    if (!socket) return;
    const endSession = () => {
      if (wasSearchingRef.current || status === "connected") {
        socket.emit("stop-search");
      }
    };
    window.addEventListener("beforeunload", endSession);
    return () => window.removeEventListener("beforeunload", endSession);
  }, [socket, status]);

  useEffect(() => {
    return () => clearDisconnectIdleTimer();
  }, [clearDisconnectIdleTimer]);

  return {
    socket: socket ?? undefined,
    status,
    peerId,
    interests,
    sharedInterests,
    messages,
    startSearch,
    skip,
    stopSearch,
    reportUser,
    dismissMessage,
    isSearching: status === "searching",
    isConnected: status === "connected",
  };
}
