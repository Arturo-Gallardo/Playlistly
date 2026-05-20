"use client";

import { useEffect } from "react";
import { ErrorFallback } from "./components/shared/ErrorFallback";
import { nunito, saira, michroma } from "./fonts";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html
      className={`${nunito.variable} ${saira.variable} ${michroma.variable}`}
      lang="en"
    >
      <body className="bg-[#111111] text-white">
        <main className="flex min-h-dvh items-center justify-center p-6">
          <ErrorFallback
            error={error}
            message="Playlistly could not load. Try again, or reload the page."
            onRetry={reset}
            showReload
            title="App failed to start"
          />
        </main>
      </body>
    </html>
  );
}
