"use client";

import { useLayoutEffect, useState } from "react";

export type OnboardingHintPlacement = {
  anchorX: number;
  anchorY: number;
};

type OnboardingPlacements = {
  playlistInput: OnboardingHintPlacement | null;
  playlistPicker: OnboardingHintPlacement | null;
};

const playlistInputSelector = '[data-onboarding-target="playlist-input"]';
const playlistPickerSelector = '[data-onboarding-target="playlist-picker"]';
const toolbarSelector = "header";

export function useOnboardingHintPlacements(isEnabled: boolean) {
  const [placements, setPlacements] = useState<OnboardingPlacements>({
    playlistInput: null,
    playlistPicker: null,
  });

  useLayoutEffect(() => {
    if (!isEnabled) {
      setPlacements({ playlistInput: null, playlistPicker: null });
      return;
    }

    function measureTarget(selector: string) {
      const element = document.querySelector(selector);

      if (!element) {
        return null;
      }

      const rect = element.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        return null;
      }

      return {
        anchorX: rect.left + rect.width / 2,
        anchorY: rect.bottom + 6,
      } satisfies OnboardingHintPlacement;
    }

    function isPickerVisible() {
      const picker = document.querySelector(playlistPickerSelector);

      if (!picker) {
        return false;
      }

      return window.matchMedia("(min-width: 640px)").matches;
    }

    function updatePlacements() {
      setPlacements({
        playlistInput: measureTarget(playlistInputSelector),
        playlistPicker: isPickerVisible()
          ? measureTarget(playlistPickerSelector)
          : null,
      });
    }

    function scheduleMeasure() {
      window.requestAnimationFrame(() => {
        updatePlacements();
      });
    }

    scheduleMeasure();

    const observedElements = [
      document.querySelector(toolbarSelector),
      document.querySelector(playlistInputSelector),
      document.querySelector(playlistPickerSelector),
    ].filter((element): element is Element => element !== null);

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    observedElements.forEach((element) => resizeObserver.observe(element));

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [isEnabled]);

  return placements;
}
