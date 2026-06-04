import { NextResponse } from "next/server";
import { getIceServers } from "@/lib/webrtc-config";

/** Returns ICE server list for WebRTC (STUN + TURN). */
export async function GET() {
  return NextResponse.json(
    { iceServers: getIceServers() },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
