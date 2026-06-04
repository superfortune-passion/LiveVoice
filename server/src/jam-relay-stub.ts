/**
 * Future server-side audio relay / mixer for Music Jam Mode.
 *
 * Random Voice MVP keeps media peer-to-peer (no audio bytes on this server).
 * Jam Mode will add:
 * - Time-stamped Opus frames from uplinks
 * - Regional edge SFU or PCM mixer
 * - Clock synchronization service
 *
 * See FUTURE_MUSIC_MODE.md and LOW_LATENCY_AUDIO.md.
 */

export interface JamRelayConfig {
  region: string;
  maxRooms: number;
}

export interface JamRelayRoom {
  roomId: string;
  participantIds: string[];
}

/** Placeholder — not wired to Socket.io in MVP. */
export class JamAudioRelayStub {
  constructor(private readonly config: JamRelayConfig) {}

  createRoom(): JamRelayRoom {
    throw new Error("Jam relay not enabled — deploy SFU edge per FUTURE_MUSIC_MODE.md");
  }

  ingestFrame(_roomId: string, _frame: Uint8Array, _timestampUs: number): void {
    throw new Error("Jam relay not enabled");
  }

  getStats() {
    return {
      enabled: false,
      region: this.config.region,
      activeRooms: 0,
    };
  }
}

export const jamRelayStub = new JamAudioRelayStub({
  region: process.env.JAM_EDGE_REGION ?? "local",
  maxRooms: 0,
});
