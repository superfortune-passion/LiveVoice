/** Shared signaling event payloads (mirrored on the client). */

export interface QueuedUser {
  socketId: string;
  interests: string[];
  joinedAt: number;
}

export interface ActivePair {
  peerA: string;
  peerB: string;
}

export interface StartSearchPayload {
  interests?: string[];
}

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

/** SDP / ICE payloads are opaque JSON relayed between peers. */
export interface SessionDescription {
  type?: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
}

export interface IceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface SdpPayload {
  sdp: SessionDescription;
  from: string;
}

export interface IceCandidatePayload {
  candidate: IceCandidateInit;
  from: string;
}

export interface PeerDisconnectedPayload {
  reason: "skip" | "disconnect" | "error";
  message?: string;
}

export type ReportReason =
  | "harassment"
  | "spam"
  | "inappropriate"
  | "underage"
  | "other";

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
