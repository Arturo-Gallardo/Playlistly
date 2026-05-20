"use client";

import { useCallback, useRef, useState } from "react";
import type { CanvasTile, Point } from "../../lib/canvas/canvas-layout";
import {
  buildPastedTileEntries,
  buildPastedTileEntriesAtWorldPoint,
  buildReplacePasteEntries,
  buildTileClipboardPayload,
  parseTileClipboardText,
  serializeTileClipboardPayload,
  sortTilesByPosition,
  type TileClipboardPayload,
} from "../../lib/canvas/tile-clipboard";

type UseCanvasClipboardOptions = {
  beginTileDragCheckpoint: () => void;
  cancelTileDragCheckpoint: () => void;
  commitTileDragCheckpoint: () => void;
  insertTilesAtPositions: (
    entries: ReturnType<typeof buildPastedTileEntries>,
    batchId: string,
  ) => string[];
  replaceTilesWithPaste: (
    entries: ReturnType<typeof buildReplacePasteEntries>,
    replaceTileIds: Set<string>,
    batchId: string,
  ) => string[];
  saveCanvasSilently: () => void;
  setSelectedTileIds: (tileIds: Set<string>) => void;
  showNotification: (message: string) => void;
  tiles: CanvasTile[];
  validSelectedTileIds: Set<string>;
};

export function useCanvasClipboard({
  beginTileDragCheckpoint,
  cancelTileDragCheckpoint,
  commitTileDragCheckpoint,
  insertTilesAtPositions,
  replaceTilesWithPaste,
  saveCanvasSilently,
  setSelectedTileIds,
  showNotification,
  tiles,
  validSelectedTileIds,
}: UseCanvasClipboardOptions) {
  const tileClipboardRef = useRef<{
    pasteCount: number;
    payload: TileClipboardPayload;
  } | null>(null);
  const [clipboardRevision, setClipboardRevision] = useState(0);

  const ensureClipboardPayload = useCallback(async () => {
    const clipboardState = tileClipboardRef.current;

    if (clipboardState) {
      return clipboardState.payload;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      return null;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      const payload = parseTileClipboardText(clipboardText);

      if (!payload) {
        return null;
      }

      tileClipboardRef.current = {
        payload,
        pasteCount: 0,
      };
      setClipboardRevision((currentRevision) => currentRevision + 1);

      return payload;
    } catch {
      return null;
    }
  }, []);

  const handleCopyTiles = useCallback(() => {
    const selectedTiles = tiles.filter((tile) =>
      validSelectedTileIds.has(tile.id),
    );
    const payload = buildTileClipboardPayload(selectedTiles);

    if (!payload) {
      return false;
    }

    tileClipboardRef.current = {
      payload,
      pasteCount: 0,
    };
    setClipboardRevision((currentRevision) => currentRevision + 1);

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(serializeTileClipboardPayload(payload));
    }

    return true;
  }, [tiles, validSelectedTileIds]);

  const performPaste = useCallback(
    async ({
      replaceTileIds = [],
      spawnWorldPoint,
    }: {
      replaceTileIds?: string[];
      spawnWorldPoint?: Point;
    }) => {
      const payload = await ensureClipboardPayload();

      if (!payload) {
        return false;
      }

      beginTileDragCheckpoint();
      const batchId = crypto.randomUUID().slice(0, 8);
      let pastedTileIds: string[] = [];

      if (replaceTileIds.length > 0) {
        const replaceTileIdSet = new Set(replaceTileIds);
        const selectedTiles = sortTilesByPosition(
          tiles.filter((tile) => replaceTileIdSet.has(tile.id)),
        );
        const anchorPositions = selectedTiles.map((tile) => ({
          x: tile.x,
          y: tile.y,
        }));
        const entries = buildReplacePasteEntries(payload, anchorPositions);

        if (entries.length === 0) {
          cancelTileDragCheckpoint();
          return false;
        }

        pastedTileIds = replaceTilesWithPaste(
          entries,
          replaceTileIdSet,
          batchId,
        );
      } else if (spawnWorldPoint) {
        const entries = buildPastedTileEntriesAtWorldPoint(
          payload,
          spawnWorldPoint,
        );

        if (entries.length === 0) {
          cancelTileDragCheckpoint();
          return false;
        }

        pastedTileIds = insertTilesAtPositions(entries, batchId);
      } else {
        const clipboardState = tileClipboardRef.current;

        if (!clipboardState) {
          cancelTileDragCheckpoint();
          return false;
        }

        const nextPasteCount = clipboardState.pasteCount + 1;
        const entries = buildPastedTileEntries(payload, nextPasteCount);

        if (entries.length === 0) {
          cancelTileDragCheckpoint();
          return false;
        }

        tileClipboardRef.current = {
          ...clipboardState,
          pasteCount: nextPasteCount,
        };
        pastedTileIds = insertTilesAtPositions(entries, batchId);
      }

      commitTileDragCheckpoint();
      saveCanvasSilently();
      setSelectedTileIds(new Set(pastedTileIds));

      const tileLabel = pastedTileIds.length === 1 ? "tile" : "tiles";
      showNotification(`${pastedTileIds.length} ${tileLabel} pasted`);

      return true;
    },
    [
      beginTileDragCheckpoint,
      cancelTileDragCheckpoint,
      commitTileDragCheckpoint,
      ensureClipboardPayload,
      insertTilesAtPositions,
      replaceTilesWithPaste,
      saveCanvasSilently,
      setSelectedTileIds,
      showNotification,
      tiles,
    ],
  );

  const handlePasteTiles = useCallback(async () => {
    if (validSelectedTileIds.size > 0) {
      return performPaste({ replaceTileIds: [...validSelectedTileIds] });
    }

    return performPaste({});
  }, [performPaste, validSelectedTileIds]);

  return {
    clipboardRevision,
    ensureClipboardPayload,
    handleCopyTiles,
    handlePasteTiles,
    performPaste,
    tileClipboardRef,
  };
}
