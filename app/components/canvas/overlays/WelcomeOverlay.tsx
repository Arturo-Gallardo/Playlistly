"use client";

import { LayoutGrid, Palette, Search, Upload } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type WelcomeOverlayProps = {
  onContinue: () => void;
};

const welcomeTips = [
  {
    description: "Paste a playlist link or pick one of yours",
    icon: Search,
  },
  {
    description: "Pan, zoom, and rearrange tiles however you want",
    icon: LayoutGrid,
  },
  {
    description: "Sort selections by color, artist, or date",
    icon: Palette,
  },
  {
    description: "Export your layout and share it with friends",
    icon: Upload,
  },
] as const;

export function WelcomeOverlay({ onContinue }: WelcomeOverlayProps) {
  const dialogTitleId = useId();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onContinue();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onContinue]);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="welcome-overlay-backdrop-enter fixed inset-0 z-[120] bg-black/60"
      />
      <div className="pointer-events-none fixed inset-0 z-[121] grid place-items-center p-4">
        <div
          aria-labelledby={dialogTitleId}
          aria-modal="true"
          className="welcome-overlay-enter welcome-overlay-panel pointer-events-auto font-control flex w-full max-w-md flex-col gap-5 rounded-xl border border-white/15 bg-[#111111] p-5 sm:p-6"
          role="dialog"
        >
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="toolbar-logo shrink-0">
                <img
                  alt=""
                  className="size-full object-contain"
                  height={44}
                  src="/PlaylistlyLogo.png"
                  width={44}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#CA3E47]">
                  Hey — first time here?
                </p>
                <h2
                  className="text-xl font-semibold leading-snug text-white sm:text-[1.35rem]"
                  id={dialogTitleId}
                >
                  Welcome to{" "}
                  <span className="font-logo text-[#CA3E47]">Playlistly</span>
                </h2>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-white/65">
              A visual workspace for your YouTube playlists. Load years of
              additions and see every thumbnail on one canvas — not just a
              scrollable list.
            </p>
          </header>

          <section aria-label="Getting started tips" className="space-y-2.5">
            <p className="text-[11px] font-semibold text-white/45">
              A few things to try:
            </p>
            <ul className="welcome-tip-list">
              {welcomeTips.map((tip) => (
                <WelcomeTip
                  description={tip.description}
                  icon={tip.icon}
                  key={tip.description}
                />
              ))}
            </ul>
          </section>

          <footer className="flex justify-end border-t border-white/10 pt-4">
            <button
              className="toolbar-button px-5 py-2 text-[11px]"
              onClick={onContinue}
              type="button"
            >
              got it
            </button>
          </footer>
        </div>
      </div>
    </>,
    document.body,
  );
}

function WelcomeTip({
  description,
  icon: Icon,
}: {
  description: string;
  icon: typeof Search;
}) {
  return (
    <li className="welcome-tip-item">
      <span className="welcome-tip-icon-slot">
        <Icon aria-hidden="true" className="welcome-tip-icon" strokeWidth={2} />
      </span>
      <p className="welcome-tip-text">{description}</p>
    </li>
  );
}
