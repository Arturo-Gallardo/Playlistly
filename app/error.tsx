"use client";

import { useEffect } from "react";
import { ErrorFallback } from "./components/shared/ErrorFallback";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#111111] p-6 text-white">
      <ErrorFallback
        error={error}
        message="Playlistly hit an unexpected error. Try again, or reload the page."
        onRetry={reset}
        showReload
        title="Something went wrong"
      />
    </main>
  );
}
