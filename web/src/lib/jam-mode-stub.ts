/**
 * Future Jam Mode — multi-musician sessions with optional server-side mixing.
 * See FUTURE_MUSIC_MODE.md at repo root.
 *
 * This module documents the client API surface; implementation is not shipped.
 */

export interface TimestampedAudioFrame {
  sessionId: string;
  sourceId: string;
  mediaTimestampUs: number;
  sequence: number;
}

export interface JamRoomConfig {
  region: string;
  maxParticipants: number;
  bpm?: number;
  useServerMix: boolean;
}

/**
 * Placeholder for N peer connections or single SFU downlink.
 * Random Voice mode uses one RTCPeerConnection via useWebRTC.
 */
export interface JamSessionManager {
  join(room: JamRoomConfig): Promise<void>;
  leave(): void;
  /** Estimated clock offset vs edge mixer (microseconds). */
  getClockOffset(): number | null;
}

export const JAM_MODE_ENABLED = false;

export function createJamSessionManager(): JamSessionManager {
  return {
    async join() {
      throw new Error("Jam Mode is not enabled. See FUTURE_MUSIC_MODE.md.");
    },
    leave() {},
    getClockOffset: () => null,
  };
}
