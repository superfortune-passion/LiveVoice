import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoiceLink — Anonymous Voice Matchmaking",
  description:
    "Talk to strangers anonymously with audio-only WebRTC chat. Optional interests, instant skip, no signup.",
  keywords: ["voice chat", "omegle", "anonymous", "webrtc", "matchmaking"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoiceLink",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0F17",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-[#0D0F17] font-sans text-white">
        {children}
      </body>
    </html>
  );
}
