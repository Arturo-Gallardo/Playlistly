"use client";

import { useEffect, useRef, type RefObject } from "react";
import { isEditableTarget } from "../../lib/canvas/canvas-input";

export type CanvasKeyboardActions = {
  canFitAllTiles: boolean;
  canRedoLayout: boolean;
  canUndoLayout: boolean;
  clearCanvas: () => void;
  clearTileSelection: () => void;
  handleCopyTiles: () => boolean;
  handleDeleteTiles: () => boolean;
  handlePasteTiles: () => Promise<boolean>;
  handleFitAllTiles: () => void;
  handleRedoLayout: () => void;
  handleUndoLayout: () => void;
  saveCanvasNow: () => void;
};

type UseCanvasKeyboardShortcutsOptions = {
  selectedTileIdsRef: RefObject<Set<string>>;
};

export function useCanvasKeyboardShortcuts({
  selectedTileIdsRef,
}: UseCanvasKeyboardShortcutsOptions) {
  const keyboardActionsRef = useRef<CanvasKeyboardActions>({
    canFitAllTiles: false,
    canRedoLayout: false,
    canUndoLayout: false,
    clearCanvas: () => {},
    clearTileSelection: () => {},
    handleCopyTiles: () => false,
    handleDeleteTiles: () => false,
    handlePasteTiles: async () => false,
    handleFitAllTiles: () => {},
    handleRedoLayout: () => {},
    handleUndoLayout: () => {},
    saveCanvasNow: () => {},
  });

  useEffect(() => {
    function isModHeld(event: KeyboardEvent) {
      return event.ctrlKey || event.metaKey;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.target === null || isEditableTarget(event.target)) {
        return;
      }

      if (event.repeat) {
        return;
      }

      const actions = keyboardActionsRef.current;

      if (event.code === "Backspace" || event.code === "Delete") {
        if (selectedTileIdsRef.current.size === 0) {
          return;
        }

        event.preventDefault();
        actions.handleDeleteTiles();
        return;
      }

      if (event.code === "Digit0" && !isModHeld(event)) {
        if (!actions.canFitAllTiles) {
          return;
        }

        event.preventDefault();
        actions.handleFitAllTiles();
        return;
      }

      if (!isModHeld(event)) {
        return;
      }

      if (event.code === "KeyZ" && !event.shiftKey) {
        if (!actions.canUndoLayout) {
          return;
        }

        event.preventDefault();
        actions.handleUndoLayout();
        return;
      }

      if (event.code === "KeyY" || (event.code === "KeyZ" && event.shiftKey)) {
        if (!actions.canRedoLayout) {
          return;
        }

        event.preventDefault();
        actions.handleRedoLayout();
        return;
      }

      if (event.code === "KeyS") {
        event.preventDefault();
        actions.saveCanvasNow();
        return;
      }

      if (event.code === "KeyK") {
        event.preventDefault();
        actions.clearCanvas();
        return;
      }

      if (event.code === "KeyC" || event.key === "c" || event.key === "C") {
        event.preventDefault();

        if (selectedTileIdsRef.current.size === 0) {
          return;
        }

        actions.handleCopyTiles();
        actions.clearTileSelection();
        return;
      }

      if (event.code === "KeyV") {
        event.preventDefault();
        void actions.handlePasteTiles();
      }
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [selectedTileIdsRef]);

  return { keyboardActionsRef };
}
