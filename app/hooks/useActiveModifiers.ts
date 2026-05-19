"use client";

import { useEffect, useState } from "react";

type ActiveKeyboardState = {
  alt: boolean;
  keys: ReadonlySet<string>;
  mod: boolean;
  shift: boolean;
};

const idleKeyboardState: ActiveKeyboardState = {
  alt: false,
  keys: new Set(),
  mod: false,
  shift: false,
};

export function useActiveModifiers() {
  const [keyboardState, setKeyboardState] =
    useState<ActiveKeyboardState>(idleKeyboardState);

  useEffect(() => {
    function syncFromKeyboard(event: KeyboardEvent) {
      setKeyboardState((currentState) => {
        const nextKeys = new Set(currentState.keys);

        if (event.type === "keydown") {
          for (const keyCode of getTrackedKeyCodes(event)) {
            nextKeys.add(keyCode);
          }
        } else {
          for (const keyCode of getTrackedKeyCodes(event)) {
            nextKeys.delete(keyCode);
          }
        }

        return {
          alt: event.altKey,
          keys: nextKeys,
          shift: event.shiftKey,
          mod: event.ctrlKey || event.metaKey,
        };
      });
    }

    function clearKeyboardState() {
      setKeyboardState(idleKeyboardState);
    }

    window.addEventListener("keydown", syncFromKeyboard, { capture: true });
    window.addEventListener("keyup", syncFromKeyboard, { capture: true });
    window.addEventListener("blur", clearKeyboardState);

    return () => {
      window.removeEventListener("keydown", syncFromKeyboard, { capture: true });
      window.removeEventListener("keyup", syncFromKeyboard, { capture: true });
      window.removeEventListener("blur", clearKeyboardState);
    };
  }, []);

  return keyboardState;
}

function getTrackedKeyCodes(event: KeyboardEvent) {
  const keyCodes = new Set<string>([event.code]);

  if (event.key === "c" || event.key === "C") {
    keyCodes.add("KeyC");
  }

  if (event.key === "v" || event.key === "V") {
    keyCodes.add("KeyV");
  }

  if (event.key === "Backspace") {
    keyCodes.add("Backspace");
  }

  if (event.key === "Delete") {
    keyCodes.add("Delete");
  }

  return keyCodes;
}
