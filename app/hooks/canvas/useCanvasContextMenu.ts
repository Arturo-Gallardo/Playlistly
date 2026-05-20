"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { ContextMenuState } from "../../types/canvas-interaction";
import type { TileClipboardPayload } from "../../lib/canvas/tile-clipboard";

type UseCanvasContextMenuOptions = {
  clipboardRevision: number;
  ensureClipboardPayload: () => Promise<TileClipboardPayload | null>;
  performPaste: (options: {
    replaceTileIds?: string[];
    spawnWorldPoint?: { x: number; y: number };
  }) => Promise<boolean>;
  tileClipboardRef: RefObject<{
    pasteCount: number;
    payload: TileClipboardPayload;
  } | null>;
};

export function useCanvasContextMenu({
  clipboardRevision,
  ensureClipboardPayload,
  performPaste,
  tileClipboardRef,
}: UseCanvasContextMenuOptions) {
  const [contextMenuState, setContextMenuState] =
    useState<ContextMenuState | null>(null);
  const contextMenuStateRef = useRef(contextMenuState);
  contextMenuStateRef.current = contextMenuState;

  const [menuCanPaste, setMenuCanPaste] = useState(false);

  const closeContextMenu = useCallback(() => {
    setContextMenuState(null);
  }, []);

  const handleContextMenuPaste = useCallback(async () => {
    const menuState = contextMenuStateRef.current;

    if (!menuState) {
      return false;
    }

    if (menuState.replaceTileIds.length > 0) {
      return performPaste({
        replaceTileIds: menuState.replaceTileIds,
      });
    }

    return performPaste({ spawnWorldPoint: menuState.worldPoint });
  }, [performPaste]);

  useEffect(() => {
    if (!contextMenuState) {
      return;
    }

    if (tileClipboardRef.current) {
      setMenuCanPaste(true);
      return;
    }

    let cancelled = false;
    setMenuCanPaste(false);

    void ensureClipboardPayload().then((payload) => {
      if (!cancelled) {
        setMenuCanPaste(Boolean(payload));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    contextMenuState,
    clipboardRevision,
    ensureClipboardPayload,
    tileClipboardRef,
  ]);

  return {
    closeContextMenu,
    contextMenuState,
    contextMenuStateRef,
    handleContextMenuPaste,
    menuCanPaste,
    setContextMenuState,
  };
}
