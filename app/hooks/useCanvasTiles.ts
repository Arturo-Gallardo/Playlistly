"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCanvasTiles,
  expandRectBounds,
  getBalancedColumnCount,
  getGridCanvasBounds,
  type CanvasTile,
  type Point,
  type Rect,
} from "../lib/canvas-layout";
import type { PlaylistVideo } from "../types/playlist";

type TileState = {
  bounds: Rect;
  columnCount: number;
  movedTileIds: Set<string>;
  tileIndexById: Map<string, number>;
  tiles: CanvasTile[];
  videoIdsKey: string;
};

function createTileState(videos: PlaylistVideo[], videoIdsKey: string): TileState {
  const tiles = createCanvasTiles(videos);
  const tileIndexById = new Map<string, number>();

  tiles.forEach((tile, index) => {
    tileIndexById.set(tile.id, index);
  });

  return {
    bounds: getGridCanvasBounds(videos.length),
    columnCount: getBalancedColumnCount(videos.length),
    movedTileIds: new Set<string>(),
    tileIndexById,
    tiles,
    videoIdsKey,
  };
}

export function useCanvasTiles(videos: PlaylistVideo[]) {
  const videoIdsKey = useMemo(
    () => videos.map((video) => video.id).join("|"),
    [videos],
  );
  const [tileState, setTileState] = useState(() =>
    createTileState(videos, videoIdsKey),
  );

  useEffect(() => {
    setTileState((currentState) => {
      if (currentState.videoIdsKey === videoIdsKey) {
        return currentState;
      }

      return createTileState(videos, videoIdsKey);
    });
  }, [videoIdsKey, videos]);

  const placeTilesAtWorldPoint = useCallback(
    (
      tileIds: Set<string>,
      worldPoint: Point,
      grabOffsets: Map<string, Point>,
    ) => {
      if (tileIds.size === 0) {
        return;
      }

      setTileState((currentState) => {
        const nextTiles = currentState.tiles.slice();
        const nextMovedTileIds = new Set(currentState.movedTileIds);
        let nextBounds = currentState.bounds;

        for (const tileId of tileIds) {
          const tileIndex = currentState.tileIndexById.get(tileId);
          const grabOffset = grabOffsets.get(tileId);

          if (tileIndex === undefined || !grabOffset) {
            continue;
          }

          const placedTile = {
            ...nextTiles[tileIndex],
            x: worldPoint.x - grabOffset.x,
            y: worldPoint.y - grabOffset.y,
          };
          nextTiles[tileIndex] = placedTile;
          nextMovedTileIds.add(tileId);
          nextBounds = expandRectBounds(nextBounds, placedTile);
        }

        return {
          ...currentState,
          bounds: nextBounds,
          movedTileIds: nextMovedTileIds,
          tiles: nextTiles,
        };
      });
    },
    [],
  );

  return {
    bounds: tileState.bounds,
    columnCount: tileState.columnCount,
    movedTileIds: tileState.movedTileIds,
    placeTilesAtWorldPoint,
    tiles: tileState.tiles,
  };
}
