"use client";

import { useCallback, useRef, useState } from "react";
import type { AnimationEvent, PointerEvent } from "react";

type ToolbarPressPhase = "idle" | "held" | "release";

type UseToolbarPressFeedbackOptions = {
  disabled?: boolean;
  releaseAnimationName: string;
};

export function useToolbarPressFeedback({
  disabled = false,
  releaseAnimationName,
}: UseToolbarPressFeedbackOptions) {
  const [phase, setPhase] = useState<ToolbarPressPhase>("idle");
  const isHeldRef = useRef(false);

  const handleAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLButtonElement>) => {
      if (event.animationName !== releaseAnimationName) {
        return;
      }

      setPhase((currentPhase) =>
        currentPhase === "release" ? "idle" : currentPhase,
      );
    },
    [releaseAnimationName],
  );

  const finishPress = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!isHeldRef.current) {
      return;
    }

    const button = event.currentTarget;

    if (button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }

    isHeldRef.current = false;
    setPhase("release");
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled || event.button !== 0) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      isHeldRef.current = true;
      setPhase("held");
    },
    [disabled],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      finishPress(event);
    },
    [finishPress],
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      finishPress(event);
    },
    [finishPress],
  );

  return {
    isHeld: phase === "held",
    isReleasing: phase === "release",
    handleAnimationEnd,
    handlePointerCancel,
    handlePointerDown,
    handlePointerUp,
  };
}
