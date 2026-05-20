"use client";

import { useCallback, useRef, useState } from "react";
import {
  canvasTileConfig,
  createBatchTileId,
  createCanvasTilesWithIds,
  resolvePastedTileId,
  expandRectBounds,
  getAppendOrigin,
  getBalancedColumnCount,
  getGridCanvasBounds,
  getRectBounds,
  type CanvasTile,
  type Point,
  type Rect,
} from "../../lib/canvas/canvas-layout";
import { hydrateCanvasVideo, toCanvasVideoWire } from "../../lib/playlist/playlist-video";
import {
  areTileLayoutCheckpointsEqual,
  createTileLayoutCheckpoint,
  type TileLayoutCheckpoint,
} from "../../lib/canvas/tile-layout-checkpoint";
import type {
  CanvasSnapshotWire,
  CanvasVideoWire,
} from "../../types/canvas-snapshot";
import type { PlaylistVideo } from "../../types/playlist";

const maxTileHistoryEntries = 50;

type TileState = {
  bounds: Rect;
  columnCount: number;
  movedTileIds: Set<string>;
  tileIndexById: Map<string, number>;
  tiles: CanvasTile[];
  tileIdsKey: string;
};

function createEmptyTileState(): TileState {
  return {
    bounds: getGridCanvasBounds(0),
    columnCount: getBalancedColumnCount(0),
    movedTileIds: new Set<string>(),
    tileIndexById: new Map<string, number>(),
    tiles: [],
    tileIdsKey: "",
  };
}

function buildTileIndexById(tiles: CanvasTile[]) {
  const tileIndexById = new Map<string, number>();

  tiles.forEach((tile, index) => {
    tileIndexById.set(tile.id, index);
  });

  return tileIndexById;
}

function buildTileIdsKey(tiles: CanvasTile[]) {
  return tiles.map((tile) => tile.id).join("|");
}

function buildTileStateFromSnapshot(
  entries: CanvasVideoWire[],
  layout: Pick<CanvasSnapshotWire, "tiles" | "movedTileIds">,
): TileState {
  const videoByTileId = new Map(
    entries.map((entry) => [entry.tileId, hydrateCanvasVideo(entry)]),
  );
  const tiles: CanvasTile[] = [];

  for (const tileLayout of layout.tiles) {
    const video = videoByTileId.get(tileLayout.id);

    if (!video) {
      continue;
    }

    tiles.push({
      id: tileLayout.id,
      video,
      x: tileLayout.x,
      y: tileLayout.y,
      width: canvasTileConfig.width,
      height: canvasTileConfig.height,
    });
  }

  return {
    bounds: getRectBounds(tiles),
    columnCount: getBalancedColumnCount(tiles.length),
    movedTileIds: new Set(layout.movedTileIds),
    tileIndexById: buildTileIndexById(tiles),
    tiles,
    tileIdsKey: buildTileIdsKey(tiles),
  };
}

type UseCanvasTilesOptions = {
  getPlaylistSources: () => string[];
  onLayoutCommitted?: () => void;
  onPlaylistSourcesRestore: (sources: string[]) => void;
};

export function useCanvasTiles({
  getPlaylistSources,
  onLayoutCommitted,
  onPlaylistSourcesRestore,
}: UseCanvasTilesOptions) {
  const [tileState, setTileState] = useState<TileState>(createEmptyTileState);
  const [historyRevision, setHistoryRevision] = useState(0);
  const tileStateRef = useRef(tileState);
  const undoStackRef = useRef<TileLayoutCheckpoint[]>([]);
  const redoStackRef = useRef<TileLayoutCheckpoint[]>([]);
  const dragStartCheckpointRef = useRef<TileLayoutCheckpoint | null>(null);

  tileStateRef.current = tileState;

  const setTileStateWithRef = useCallback(
    (nextState: TileState | ((currentState: TileState) => TileState)) => {
      if (typeof nextState === "function") {
        // resolve against the live ref so undo checkpoints see paste/delete immediately
        const resolvedState = nextState(tileStateRef.current);
        tileStateRef.current = resolvedState;
        setTileState(resolvedState);
        return;
      }

      tileStateRef.current = nextState;
      setTileState(nextState);
    },
    [],
  );

  const getTileDragSnapshot = useCallback(() => tileStateRef.current, []);

  const getLayoutSnapshot = useCallback(
    () => ({
      movedTileIds: tileStateRef.current.movedTileIds,
      tiles: tileStateRef.current.tiles,
    }),
    [],
  );

  const getVideosForSnapshot = useCallback((): CanvasVideoWire[] => {
    return tileStateRef.current.tiles.map((tile) =>
      toCanvasVideoWire(tile.id, tile.video),
    );
  }, []);

  const bumpHistory = useCallback(() => {
    setHistoryRevision((currentRevision) => currentRevision + 1);
  }, []);

  const captureCurrentCheckpoint = useCallback((): TileLayoutCheckpoint => {
    return createTileLayoutCheckpoint({
      tiles: tileStateRef.current.tiles,
      movedTileIds: tileStateRef.current.movedTileIds,
      playlistSources: getPlaylistSources(),
      videos: tileStateRef.current.tiles.map((tile) =>
        toCanvasVideoWire(tile.id, tile.video),
      ),
    });
  }, [getPlaylistSources]);

  const clearTileHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    dragStartCheckpointRef.current = null;
    bumpHistory();
  }, [bumpHistory]);

  const applyTileLayoutCheckpoint = useCallback(
    (checkpoint: TileLayoutCheckpoint) => {
      setTileStateWithRef(
        buildTileStateFromSnapshot(checkpoint.videos, {
          tiles: checkpoint.tiles,
          movedTileIds: checkpoint.movedTileIds,
        }),
      );
      onPlaylistSourcesRestore(checkpoint.playlistSources);
    },
    [onPlaylistSourcesRestore, setTileStateWithRef],
  );

  const appendPlaylistTiles = useCallback(
    (videos: PlaylistVideo[], batchId: string): Rect => {
      if (videos.length === 0) {
        return getGridCanvasBounds(0);
      }

      const localBatchBounds = getRectBounds(
        createCanvasTilesWithIds(
          videos,
          (video) => createBatchTileId(batchId, video.id),
          { x: 0, y: 0 },
        ),
      );

      let nextBatchBounds = localBatchBounds;

      setTileStateWithRef((currentState) => {
        const origin =
          currentState.tiles.length === 0
            ? { x: 0, y: 0 }
            : getAppendOrigin(currentState.bounds, localBatchBounds);
        const nextBatchTiles = createCanvasTilesWithIds(
          videos,
          (video) => createBatchTileId(batchId, video.id),
          origin,
        );
        nextBatchBounds = getRectBounds(nextBatchTiles);
        const nextTiles = [...currentState.tiles, ...nextBatchTiles];

        return {
          bounds: getRectBounds(nextTiles),
          columnCount: getBalancedColumnCount(nextTiles.length),
          movedTileIds: currentState.movedTileIds,
          tileIndexById: buildTileIndexById(nextTiles),
          tiles: nextTiles,
          tileIdsKey: buildTileIdsKey(nextTiles),
        };
      });

      return nextBatchBounds;
    },
    [setTileStateWithRef],
  );

  const restoreTileState = useCallback(
    (
      entries: CanvasVideoWire[],
      snapshot: Pick<CanvasSnapshotWire, "tiles" | "movedTileIds">,
    ) => {
      setTileStateWithRef(buildTileStateFromSnapshot(entries, snapshot));
      clearTileHistory();
    },
    [clearTileHistory, setTileStateWithRef],
  );

  const resetTileState = useCallback(() => {
    setTileStateWithRef(createEmptyTileState());
    clearTileHistory();
  }, [clearTileHistory, setTileStateWithRef]);

  const beginTileDragCheckpoint = useCallback(() => {
    dragStartCheckpointRef.current = captureCurrentCheckpoint();
  }, [captureCurrentCheckpoint]);

  const cancelTileDragCheckpoint = useCallback(() => {
    dragStartCheckpointRef.current = null;
  }, []);

  const revertTileDragCheckpoint = useCallback(() => {
    const dragStartCheckpoint = dragStartCheckpointRef.current;
    dragStartCheckpointRef.current = null;

    if (!dragStartCheckpoint) {
      return;
    }

    applyTileLayoutCheckpoint(dragStartCheckpoint);
  }, [applyTileLayoutCheckpoint]);

  const commitTileDragCheckpoint = useCallback(() => {
    const dragStartCheckpoint = dragStartCheckpointRef.current;
    dragStartCheckpointRef.current = null;

    if (!dragStartCheckpoint) {
      return;
    }

    const dragEndCheckpoint = captureCurrentCheckpoint();

    if (areTileLayoutCheckpointsEqual(dragStartCheckpoint, dragEndCheckpoint)) {
      return;
    }

    undoStackRef.current.push(dragStartCheckpoint);

    if (undoStackRef.current.length > maxTileHistoryEntries) {
      undoStackRef.current.shift();
    }

    redoStackRef.current = [];
    bumpHistory();
    onLayoutCommitted?.();
  }, [bumpHistory, captureCurrentCheckpoint, onLayoutCommitted]);

  const undoTiles = useCallback(() => {
    const previousCheckpoint = undoStackRef.current.pop();

    if (!previousCheckpoint) {
      return;
    }

    redoStackRef.current.push(captureCurrentCheckpoint());
    applyTileLayoutCheckpoint(previousCheckpoint);
    bumpHistory();
  }, [applyTileLayoutCheckpoint, bumpHistory, captureCurrentCheckpoint]);

  const redoTiles = useCallback(() => {
    const nextCheckpoint = redoStackRef.current.pop();

    if (!nextCheckpoint) {
      return;
    }

    undoStackRef.current.push(captureCurrentCheckpoint());
    applyTileLayoutCheckpoint(nextCheckpoint);
    bumpHistory();
  }, [applyTileLayoutCheckpoint, bumpHistory, captureCurrentCheckpoint]);

  const insertTilesAtPositions = useCallback(
    (
      entries: Array<{ video: PlaylistVideo; x: number; y: number }>,
      batchId: string,
    ) => {
      if (entries.length === 0) {
        return [] as string[];
      }

      const newTileIds: string[] = [];

      setTileStateWithRef((currentState) => {
        const occupiedTileIds = new Set(
          currentState.tiles.map((tile) => tile.id),
        );

        const insertedTiles = entries.map((entry, entryIndex) => {
          const tileId = resolvePastedTileId(
            occupiedTileIds,
            batchId,
            entry.video.id,
            entryIndex,
          );
          occupiedTileIds.add(tileId);
          newTileIds.push(tileId);

          return {
            id: tileId,
            video: entry.video,
            x: entry.x,
            y: entry.y,
            width: canvasTileConfig.width,
            height: canvasTileConfig.height,
          } satisfies CanvasTile;
        });

        const nextMovedTileIds = new Set(currentState.movedTileIds);
        insertedTiles.forEach((tile) => {
          nextMovedTileIds.add(tile.id);
        });

        const nextTiles = [...currentState.tiles, ...insertedTiles];

        return {
          bounds: getRectBounds(nextTiles),
          columnCount: getBalancedColumnCount(nextTiles.length),
          movedTileIds: nextMovedTileIds,
          tileIndexById: buildTileIndexById(nextTiles),
          tiles: nextTiles,
          tileIdsKey: buildTileIdsKey(nextTiles),
        };
      });

      return newTileIds;
    },
    [setTileStateWithRef],
  );

  const replaceTilesWithPaste = useCallback(
    (
      entries: Array<{ video: PlaylistVideo; x: number; y: number }>,
      removeTileIds: ReadonlySet<string>,
      batchId: string,
    ) => {
      if (entries.length === 0) {
        return [] as string[];
      }

      const newTileIds: string[] = [];

      setTileStateWithRef((currentState) => {
        const keptTiles = currentState.tiles.filter(
          (tile) => !removeTileIds.has(tile.id),
        );
        const occupiedTileIds = new Set(keptTiles.map((tile) => tile.id));

        const insertedTiles = entries.map((entry, entryIndex) => {
          const tileId = resolvePastedTileId(
            occupiedTileIds,
            batchId,
            entry.video.id,
            entryIndex,
          );
          occupiedTileIds.add(tileId);
          newTileIds.push(tileId);

          return {
            id: tileId,
            video: entry.video,
            x: entry.x,
            y: entry.y,
            width: canvasTileConfig.width,
            height: canvasTileConfig.height,
          } satisfies CanvasTile;
        });

        const nextTiles = [...keptTiles, ...insertedTiles];
        const nextMovedTileIds = new Set(currentState.movedTileIds);

        removeTileIds.forEach((tileId) => {
          nextMovedTileIds.delete(tileId);
        });
        insertedTiles.forEach((tile) => {
          nextMovedTileIds.add(tile.id);
        });

        return {
          bounds: getRectBounds(nextTiles),
          columnCount: getBalancedColumnCount(nextTiles.length),
          movedTileIds: nextMovedTileIds,
          tileIndexById: buildTileIndexById(nextTiles),
          tiles: nextTiles,
          tileIdsKey: buildTileIdsKey(nextTiles),
        };
      });

      return newTileIds;
    },
    [setTileStateWithRef],
  );

  const removeTilesByIds = useCallback(
    (tileIds: ReadonlySet<string>) => {
      if (tileIds.size === 0) {
        return 0;
      }

      let removedCount = 0;

      setTileStateWithRef((currentState) => {
        const nextTiles = currentState.tiles.filter((tile) => {
          if (tileIds.has(tile.id)) {
            removedCount += 1;
            return false;
          }

          return true;
        });

        if (removedCount === 0) {
          return currentState;
        }

        const nextMovedTileIds = new Set(currentState.movedTileIds);
        tileIds.forEach((tileId) => {
          nextMovedTileIds.delete(tileId);
        });

        return {
          bounds: getRectBounds(nextTiles),
          columnCount: getBalancedColumnCount(nextTiles.length),
          movedTileIds: nextMovedTileIds,
          tileIndexById: buildTileIndexById(nextTiles),
          tiles: nextTiles,
          tileIdsKey: buildTileIdsKey(nextTiles),
        };
      });

      return removedCount;
    },
    [setTileStateWithRef],
  );

  const placeTilesAtWorldPoint = useCallback(
    (
      tileIds: Set<string>,
      worldPoint: Point,
      grabOffsets: Map<string, Point>,
    ) => {
      if (tileIds.size === 0) {
        return;
      }

      setTileStateWithRef((currentState) => {
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
    [setTileStateWithRef],
  );

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;
  void historyRevision;

  return {
    appendPlaylistTiles,
    beginTileDragCheckpoint,
    bounds: tileState.bounds,
    cancelTileDragCheckpoint,
    canRedo,
    canUndo,
    commitTileDragCheckpoint,
    getLayoutSnapshot,
    getTileDragSnapshot,
    getVideosForSnapshot,
    insertTilesAtPositions,
    movedTileIds: tileState.movedTileIds,
    replaceTilesWithPaste,
    placeTilesAtWorldPoint,
    redoTiles,
    removeTilesByIds,
    resetTileState,
    restoreTileState,
    revertTileDragCheckpoint,
    tiles: tileState.tiles,
    undoTiles,
  };
}
