"use client";

import { useSession } from "next-auth/react";

export function CanvasEmptyState() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5] grid place-items-center px-6"
      aria-live="polite"
    >
      <p className="font-control max-w-md text-center text-sm font-semibold leading-6 text-white/80">
        Load a playlist to see it here!
        {!isSignedIn ? (
          <span className="mt-2 block text-xs font-medium uppercase tracking-[0.2em] text-white/45">
            Or log in to load one of yours
          </span>
        ) : null}
      </p>
    </div>
  );
}
