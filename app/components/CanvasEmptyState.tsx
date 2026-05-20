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
      <div className="canvas-empty-state-enter max-w-md text-center">
        <p className="font-control text-base font-semibold leading-7 text-white/80 sm:text-lg sm:leading-8">
          Load a playlist to see it here!
        </p>
        {!isSignedIn ? (
          <p className="canvas-empty-state-enter-delayed font-control mt-2 text-xs font-medium uppercase tracking-[0.2em] text-white/45">
            Or log in to load one of yours
          </p>
        ) : null}
      </div>
    </div>
  );
}
