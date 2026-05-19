"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  buildCanvasSnapshot,
  clearCanvasSnapshot,
  readCanvasSnapshot,
  writeCanvasSnapshot,
} from "../lib/canvas-storage";
import type { CanvasTile } from "../lib/canvas-layout";
import type {
  CanvasCameraWire,
  CanvasSnapshotWire,
  CanvasVideoWire,
} from "../types/canvas-snapshot";

const autoSaveDelayMs = 500;

type LayoutSnapshot = {
  movedTileIds: ReadonlySet<string>;
  tiles: CanvasTile[];
};

type PersistResult = "saved" | "no-playlist" | "storage-failed";

type UseCanvasPersistenceOptions = {
  camera: CanvasCameraWire;
  getLayoutSnapshot: () => LayoutSnapshot;
  getLiveCamera: () => CanvasCameraWire;
  getPlaylistSources: () => string[];
  getVideosForSnapshot: () => CanvasVideoWire[];
  hasTiles: boolean;
  onCanvasClear?: () => void;
  onClearUndo?: (playlistSources: string[]) => void;
  onManualSave?: (result: PersistResult) => void;
  onRestoreComplete?: (playlistSources: string[]) => void;
  playlistSourcesKey: string;
  resetCamera: () => void;
  resetTileState: () => void;
  restoreCamera: (camera: CanvasCameraWire) => void;
  restoreTileState: (
    entries: CanvasVideoWire[],
    snapshot: {
      tiles: { id: string; x: number; y: number }[];
      movedTileIds: string[];
    },
  ) => void;
  setPlaylistSources: (sources: string[]) => void;
  tilesLayoutKey: string;
};

export function useCanvasPersistence({
  camera,
  getLayoutSnapshot,
  getLiveCamera,
  getPlaylistSources,
  getVideosForSnapshot,
  hasTiles,
  onCanvasClear,
  onClearUndo,
  onManualSave,
  onRestoreComplete,
  playlistSourcesKey,
  resetCamera,
  resetTileState,
  restoreCamera,
  restoreTileState,
  setPlaylistSources,
  tilesLayoutKey,
}: UseCanvasPersistenceOptions) {
  const isRestoringRef = useRef(true);
  const hasRestoredRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const onManualSaveRef = useRef(onManualSave);
  const onClearUndoRef = useRef(onClearUndo);
  const hasTilesRef = useRef(hasTiles);
  const clearUndoCheckpointRef = useRef<CanvasSnapshotWire | null>(null);
  const clearRedoCheckpointRef = useRef<CanvasSnapshotWire | null>(null);
  const [clearUndoRevision, setClearUndoRevision] = useState(0);

  onManualSaveRef.current = onManualSave;
  onClearUndoRef.current = onClearUndo;
  hasTilesRef.current = hasTiles;

  const bumpClearUndo = useCallback(() => {
    setClearUndoRevision((currentRevision) => currentRevision + 1);
  }, []);

  const discardClearHistory = useCallback(() => {
    if (
      clearUndoCheckpointRef.current === null &&
      clearRedoCheckpointRef.current === null
    ) {
      return;
    }

    clearUndoCheckpointRef.current = null;
    clearRedoCheckpointRef.current = null;
    bumpClearUndo();
  }, [bumpClearUndo]);

  const cancelPendingAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  const persistCanvas = useCallback(
    (shouldNotifyManualSave: boolean, force = false) => {
      if (!force && isRestoringRef.current) {
        return "storage-failed" satisfies PersistResult;
      }

      if (!hasTilesRef.current) {
        clearCanvasSnapshot();

        if (shouldNotifyManualSave) {
          onManualSaveRef.current?.("no-playlist");
        }

        return "no-playlist" satisfies PersistResult;
      }

      const { movedTileIds, tiles } = getLayoutSnapshot();
      const snapshotVideos = getVideosForSnapshot();

      const didSave = writeCanvasSnapshot(
        buildCanvasSnapshot({
          videos: snapshotVideos,
          tiles,
          movedTileIds,
          camera: getLiveCamera(),
          playlistSources: getPlaylistSources(),
        }),
      );

      const result: PersistResult = didSave ? "saved" : "storage-failed";

      if (shouldNotifyManualSave) {
        onManualSaveRef.current?.(result);
      }

      return result;
    },
    [getLayoutSnapshot, getLiveCamera, getPlaylistSources, getVideosForSnapshot],
  );

  const saveCanvasNow = useCallback(() => {
    cancelPendingAutoSave();
    persistCanvas(true, true);
  }, [cancelPendingAutoSave, persistCanvas]);

  const captureClearUndoCheckpoint = useCallback(() => {
    if (!hasTilesRef.current) {
      return;
    }

    const { movedTileIds, tiles } = getLayoutSnapshot();

    clearUndoCheckpointRef.current = buildCanvasSnapshot({
      videos: getVideosForSnapshot(),
      tiles,
      movedTileIds,
      camera: getLiveCamera(),
      playlistSources: getPlaylistSources(),
    });
    bumpClearUndo();
  }, [bumpClearUndo, getLayoutSnapshot, getLiveCamera, getPlaylistSources, getVideosForSnapshot]);

  const applyCanvasClear = useCallback(() => {
    cancelPendingAutoSave();
    clearCanvasSnapshot();
    isRestoringRef.current = true;
    setPlaylistSources([]);
    resetTileState();
    resetCamera();
    onCanvasClear?.();

    requestAnimationFrame(() => {
      isRestoringRef.current = false;
    });
  }, [
    cancelPendingAutoSave,
    onCanvasClear,
    resetCamera,
    resetTileState,
    setPlaylistSources,
  ]);

  const undoClear = useCallback(() => {
    const checkpoint = clearUndoCheckpointRef.current;

    if (!checkpoint) {
      return false;
    }

    cancelPendingAutoSave();
    clearUndoCheckpointRef.current = null;
    clearRedoCheckpointRef.current = checkpoint;
    bumpClearUndo();

    isRestoringRef.current = true;
    setPlaylistSources(checkpoint.playlistSources);
    restoreTileState(checkpoint.videos, {
      tiles: checkpoint.tiles,
      movedTileIds: checkpoint.movedTileIds,
    });
    restoreCamera(checkpoint.camera);
    writeCanvasSnapshot(checkpoint);
    onClearUndoRef.current?.(checkpoint.playlistSources);

    requestAnimationFrame(() => {
      isRestoringRef.current = false;
    });

    return true;
  }, [
    bumpClearUndo,
    cancelPendingAutoSave,
    restoreCamera,
    restoreTileState,
    setPlaylistSources,
  ]);

  const redoClear = useCallback(() => {
    const checkpoint = clearRedoCheckpointRef.current;

    if (!checkpoint) {
      return false;
    }

    clearUndoCheckpointRef.current = checkpoint;
    clearRedoCheckpointRef.current = null;
    bumpClearUndo();
    applyCanvasClear();

    return true;
  }, [applyCanvasClear, bumpClearUndo]);

  const clearCanvas = useCallback(() => {
    captureClearUndoCheckpoint();
    clearRedoCheckpointRef.current = null;
    applyCanvasClear();
  }, [applyCanvasClear, captureClearUndoCheckpoint]);

  useLayoutEffect(() => {
    if (hasRestoredRef.current) {
      return;
    }

    hasRestoredRef.current = true;
    const snapshot = readCanvasSnapshot();

    if (!snapshot || snapshot.videos.length === 0) {
      isRestoringRef.current = false;
      return;
    }

    setPlaylistSources(snapshot.playlistSources);
    restoreTileState(snapshot.videos, {
      tiles: snapshot.tiles,
      movedTileIds: snapshot.movedTileIds,
    });
    restoreCamera(snapshot.camera);
    onRestoreComplete?.(snapshot.playlistSources);

    requestAnimationFrame(() => {
      isRestoringRef.current = false;
    });
  }, [
    onRestoreComplete,
    restoreCamera,
    restoreTileState,
    setPlaylistSources,
  ]);

  useEffect(() => {
    if (isRestoringRef.current) {
      return;
    }

    cancelPendingAutoSave();

    if (!hasTiles) {
      clearCanvasSnapshot();
      return;
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      autoSaveTimerRef.current = null;
      persistCanvas(false);
    }, autoSaveDelayMs);

    return cancelPendingAutoSave;
  }, [
    camera,
    cancelPendingAutoSave,
    hasTiles,
    persistCanvas,
    playlistSourcesKey,
    tilesLayoutKey,
  ]);

  useEffect(() => {
    function handlePageHide() {
      if (isRestoringRef.current || !hasTilesRef.current) {
        return;
      }

      cancelPendingAutoSave();
      persistCanvas(false, true);
    }

    window.addEventListener("pagehide", handlePageHide);

    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [cancelPendingAutoSave, persistCanvas]);

  const saveCanvasSilently = useCallback(() => {
    cancelPendingAutoSave();
    persistCanvas(false, true);
  }, [cancelPendingAutoSave, persistCanvas]);

  const canUndoClear = clearUndoCheckpointRef.current !== null;
  const canRedoClear = clearRedoCheckpointRef.current !== null;
  void clearUndoRevision;

  return {
    canSave: hasTiles,
    canRedoClear,
    canUndoClear,
    clearCanvas,
    discardClearHistory,
    redoClear,
    saveCanvasNow,
    saveCanvasSilently,
    undoClear,
  };
}
