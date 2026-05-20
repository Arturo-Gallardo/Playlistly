"use client";

import { useMemo, useRef, useState } from "react";
import type { CanvasTile } from "../../lib/canvas/canvas-layout";

export function useCanvasSelection(tiles: CanvasTile[]) {
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(
    () => new Set(),
  );
  const selectedTileIdsRef = useRef(selectedTileIds);

  const validSelectedTileIds = useMemo(() => {
    if (selectedTileIds.size === 0) {
      return selectedTileIds;
    }

    const existingTileIds = new Set(tiles.map((tile) => tile.id));
    const nextSelection = new Set(
      [...selectedTileIds].filter((tileId) => existingTileIds.has(tileId)),
    );

    if (nextSelection.size === selectedTileIds.size) {
      return selectedTileIds;
    }

    return nextSelection;
  }, [selectedTileIds, tiles]);

  selectedTileIdsRef.current = validSelectedTileIds;

  const clearTileSelection = () => {
    setSelectedTileIds(new Set());
  };

  return {
    clearTileSelection,
    selectedTileIdsRef,
    setSelectedTileIds,
    validSelectedTileIds,
  };
}
