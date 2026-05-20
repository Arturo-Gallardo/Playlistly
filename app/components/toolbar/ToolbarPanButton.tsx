"use client";

import { useToolbarPressFeedback } from "../../hooks/toolbar/useToolbarPressFeedback";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type ToolbarPanButtonProps = {
  active?: boolean;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  dataOnboardingTarget?: string;
  disabled?: boolean;
  onClick: () => void;
};

export function ToolbarPanButton({
  active = false,
  ariaLabel,
  children,
  className,
  dataOnboardingTarget,
  disabled = false,
  onClick,
}: ToolbarPanButtonProps) {
  const {
    isHeld,
    isReleasing,
    handleAnimationEnd,
    handlePointerCancel,
    handlePointerDown,
    handlePointerUp,
  } = useToolbarPressFeedback({
    disabled,
    releaseAnimationName: "toolbar-pan-button-pop",
  });

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "toolbar-pan-button toolbar-pan-button-glow",
        isHeld && "toolbar-pan-button-held",
        isReleasing && "toolbar-pan-button-release",
        active && "playlist-picker-button-active",
        className,
      )}
      data-onboarding-target={dataOnboardingTarget}
      disabled={disabled}
      onAnimationEnd={handleAnimationEnd}
      onClick={onClick}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      type="button"
    >
      {children}
    </button>
  );
}
