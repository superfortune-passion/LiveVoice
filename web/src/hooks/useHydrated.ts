"use client";

import { useSyncExternalStore } from "react";

/** True on the client after hydration; always false during SSR. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
