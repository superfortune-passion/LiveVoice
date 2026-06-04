/** Client-side mirror of server signaling events. */

export type ConnectionStatus =
  | "idle"
  | "searching"
  | "connected"
  | "disconnected"
  | "error";

export type ReportReason =
  | "harassment"
  | "spam"
  | "inappropriate"
  | "underage"
  | "other";

export interface MatchedPayload {
  peerId: string;
  isInitiator: boolean;
  sharedInterests?: string[];
}

export interface PlatformStatsPayload {
  online: number;
  waiting: number;
  inCall: number;
}

export interface SdpPayload {
  sdp: RTCSessionDescriptionInit;
  from: string;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
  from: string;
}

export interface PeerDisconnectedPayload {
  reason: "skip" | "disconnect" | "error";
  message?: string;
}

export interface StartSearchPayload {
  interests?: string[];
}

export interface ReportPayload {
  reason: ReportReason;
}

export interface RateLimitedPayload {
  action: string;
  message: string;
}

export interface ReportReceivedPayload {
  message: string;
}

export interface StatusMessage {
  id: string;
  type: "info" | "success" | "warning" | "error";
  text: string;
}

export interface ServerToClientEvents {
  "platform-stats": (payload: PlatformStatsPayload) => void;
  searching: () => void;
  matched: (payload: MatchedPayload) => void;
  "peer-disconnected": (payload: PeerDisconnectedPayload) => void;
  "session-ended": () => void;
  "rate-limited": (payload: RateLimitedPayload) => void;
  "report-received": (payload: ReportReceivedPayload) => void;
  offer: (payload: SdpPayload) => void;
  answer: (payload: SdpPayload) => void;
  "ice-candidate": (payload: IceCandidatePayload) => void;
}

export interface ClientToServerEvents {
  "start-search": (payload?: StartSearchPayload) => void;
  "stop-search": () => void;
  skip: () => void;
  report: (payload: ReportPayload) => void;
  offer: (payload: { sdp: RTCSessionDescriptionInit }) => void;
  answer: (payload: { sdp: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (payload: { candidate: RTCIceCandidateInit }) => void;
}
