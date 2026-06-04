"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { scheduleAfterPaint } from "@/lib/schedule-client-work";
import { getSocket } from "@/lib/socket";
import type { PlatformStats } from "@/types/app";
import type {
  ClientToServerEvents,
  PlatformStatsPayload,
  ServerToClientEvents,
} from "@/types/socket";

export function usePlatformStats() {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [hasLiveStats, setHasLiveStats] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    return scheduleAfterPaint(() => setSocket(getSocket()));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const apply = (payload: PlatformStatsPayload) => {
      setStats({
        online: payload.online,
        waiting: payload.waiting,
        inCall: payload.inCall,
      });
      setHasLiveStats(true);
    };

    const onConnect = () => {
      setSocketConnected(true);
      setHasLiveStats(false);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
      setHasLiveStats(false);
      setStats(null);
    };

    const onConnectError = (err: Error) => {
      setConnectError(err.message);
      setSocketConnected(false);
    };

    socket.on("platform-stats", apply);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) onConnect();

    return () => {
      socket.off("platform-stats", apply);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [socket]);

  const networkOnly = socketConnected && !hasLiveStats;

  return {
    stats,
    hasLiveStats,
    networkOnly,
    socketConnected,
    connectError,
  };
}
