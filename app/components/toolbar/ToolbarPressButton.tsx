"use client";

import { useToolbarPressFeedback } from "../../hooks/toolbar/useToolbarPressFeedback";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type ToolbarPressButtonProps = {
  children: ReactNode;
  className?: string;
  variant: "pill" | "icon";
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "aria-pressed" | "disabled" | "onClick" | "type"
>;

export function ToolbarPressButton({
  children,
  className,
  disabled,
  onClick,
  type = "button",
  variant,
  ...rest
}: ToolbarPressButtonProps) {
  const {
    isHeld,
    isReleasing,
    handleAnimationEnd,
    handlePointerCancel,
    handlePointerDown,
    handlePointerUp,
  } = useToolbarPressFeedback({
    disabled,
    releaseAnimationName: "toolbar-action-release",
  });

  return (
    <button
      className={cn(
        variant === "pill" ? "toolbar-button" : "toolbar-icon-button",
        isHeld && "toolbar-action-held",
        isReleasing && "toolbar-action-release",
        className,
      )}
      disabled={disabled}
      onAnimationEnd={handleAnimationEnd}
      onClick={onClick}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      type={type}
      {...rest}
    >
      {children}
    </button>
  );
}
