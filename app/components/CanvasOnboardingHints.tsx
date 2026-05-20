"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  useOnboardingHintPlacements,
  type OnboardingHintPlacement,
} from "../hooks/useOnboardingHintPlacements";
import { CurvedHintArrow } from "./CurvedHintArrow";

type CanvasOnboardingHintsProps = {
  isPlaylistPickerOpen: boolean;
  isVisible: boolean;
};

export function CanvasOnboardingHints({
  isPlaylistPickerOpen,
  isVisible,
}: CanvasOnboardingHintsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const placements = useOnboardingHintPlacements(isVisible && isMounted);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isVisible || !isMounted) {
    return null;
  }

  const pickerLabel = isSignedIn
    ? "or pick one of your playlists with P"
    : "log in to browse your playlists with P";

  return createPortal(
    <>
      {placements.playlistInput ? (
        <OnboardingHint
          bend="left"
          label="paste a youtube playlist link, then hit load"
          placement={placements.playlistInput}
        />
      ) : null}
      {placements.playlistPicker && !isPlaylistPickerOpen ? (
        <OnboardingHint
          bend="right"
          label={pickerLabel}
          placement={placements.playlistPicker}
        />
      ) : null}
    </>,
    document.body,
  );
}

function OnboardingHint({
  bend,
  label,
  placement,
}: {
  bend: "left" | "right";
  label: string;
  placement: OnboardingHintPlacement;
}) {
  return (
    <div
      className="canvas-onboarding-hint pointer-events-none fixed z-[6] flex w-[12rem] flex-col items-center"
      style={{
        left: placement.anchorX,
        top: placement.anchorY,
        transform: "translateX(-50%)",
      }}
    >
      <CurvedHintArrow bend={bend} />
      <p className="font-control mt-1.5 text-center text-[11px] font-medium leading-snug text-white/40">
        {label}
      </p>
    </div>
  );
}
