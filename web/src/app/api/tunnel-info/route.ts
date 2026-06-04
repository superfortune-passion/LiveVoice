import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

/** Live ngrok URLs written by `npm run tunnel`. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ active: false }, { status: 404 });
  }

  const file = path.join(process.cwd(), "..", "tunnel-urls.json");
  try {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw) as {
      webUrl?: string;
      signalingUrl?: string;
      shareWithComputerB?: string;
      updatedAt?: string;
    };
    return NextResponse.json({
      active: true,
      webUrl: data.webUrl,
      signalingUrl: data.signalingUrl,
      shareWithComputerB: data.shareWithComputerB ?? data.webUrl,
      updatedAt: data.updatedAt,
    });
  } catch {
    return NextResponse.json({ active: false });
  }
}
