/** Unified UI phase driven by matchmaking + WebRTC state. */
export type AppPhase =
  | "idle"
  | "mic_permission"
  | "searching"
  | "connecting"
  | "connected"
  | "peer_disconnected"
  | "error";

export interface PlatformStats {
  online: number;
  waiting: number;
  inCall: number;
}
