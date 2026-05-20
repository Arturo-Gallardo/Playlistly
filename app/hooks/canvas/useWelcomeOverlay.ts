"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hasWelcomeBeenDismissed,
  markWelcomeDismissed,
} from "../../lib/canvas/welcome-storage";

export function useWelcomeOverlay() {
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [hasHydratedWelcomeState, setHasHydratedWelcomeState] = useState(false);

  useEffect(() => {
    setIsWelcomeVisible(!hasWelcomeBeenDismissed());
    setHasHydratedWelcomeState(true);
  }, []);

  const dismissWelcome = useCallback(() => {
    markWelcomeDismissed();
    setIsWelcomeVisible(false);
  }, []);

  return {
    dismissWelcome,
    isWelcomeVisible: hasHydratedWelcomeState && isWelcomeVisible,
  };
}
