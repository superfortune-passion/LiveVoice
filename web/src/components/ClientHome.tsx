"use client";

import dynamic from "next/dynamic";
import { LandingLoading } from "./LandingLoading";

const AppShell = dynamic(
  () => import("./AppShell").then((m) => ({ default: m.AppShell })),
  { ssr: false, loading: () => <LandingLoading /> }
);

export function ClientHome() {
  return <AppShell />;
}
