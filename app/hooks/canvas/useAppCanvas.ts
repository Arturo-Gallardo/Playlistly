"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCanvasCamera } from "./useCanvasCamera";
import { useCanvasPersistence } from "./useCanvasPersistence";
import { useCanvasTiles } from "./useCanvasTiles";
import { useCanvasTileEnter } from "./useCanvasTileEnter";
import { usePlaylistVideos } from "../playlist/usePlaylistVideos";
import { playlistSourcesInclude } from "../../lib/playlist/playlist-source";
import { clearAllPlaylistVideoCache } from "../../lib/playlist/playlist-cache";
import { clearCanvasSnapshot } from "../../lib/canvas/canvas-storage";
import {
  downloadCanvasSnapshotFile,
  parseCanvasSnapshotFile,
} from "../../lib/canvas/canvas-import-export";
import { useCanvasPreferences } from "./useCanvasPreferences";
import { useCanvasClipboard } from "./useCanvasClipboard";
import { useCanvasContextMenu } from "./useCanvasContextMenu";
import { useCanvasKeyboardShortcuts } from "./useCanvasKeyboardShortcuts";
import { useCanvasNotifications } from "./useCanvasNotifications";
import { useCanvasPointerInteractions } from "./useCanvasPointerInteractions";
import { useCanvasSelection } from "./useCanvasSelection";
import { useCanvasViewport } from "./useCanvasViewport";
import {
  buildOrderedTilePositions,
  getTileOrderCriterionLabel,
  sortTilesByArtist,
  sortTilesByColor,
  sortTilesByDate,
  type TileOrderCriterion,
} from "../../lib/canvas/tile-ordering";

export function useAppCanvas() {
  const { loadNotification, showNotification } = useCanvasNotifications();

  const [playlistSources, setPlaylistSources] = useState<string[]>([]);
  const playlistSourcesRef = useRef(playlistSources);
  playlistSourcesRef.current = playlistSources;

  const syncPlaylistSources = useCallback(
    (next: string[] | ((previous: string[]) => string[])) => {
      setPlaylistSources((previous) => {
        const resolved = typeof next === "function" ? next(previous) : next;
        playlistSourcesRef.current = resolved;
        return resolved;
      });
    },
    [],
  );

  const playlistSourcesKey = useMemo(
    () => playlistSources.join("\0"),
    [playlistSources],
  );

  const {
    areVideoDetailsHidden,
    isShortcutLegendVisible,
    setAreVideoDetailsHidden,
    setIsShortcutLegendVisible,
  } = useCanvasPreferences();

  const [isSlowPlaylistLoad, setIsSlowPlaylistLoad] = useState(false);
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false);

  const {
    camera,
    centerCameraOnRect,
    getLiveCamera,
    panBy,
    resetCamera,
    restoreCamera,
    syncCamera,
    worldLayerRef,
    zoomAtPoint,
  } = useCanvasCamera();

  const { errorMessage, fetchPlaylist, status: playlistStatus } =
    usePlaylistVideos();

  const discardClearHistoryRef = useRef<() => void>(() => {});

  const {
    appendPlaylistTiles,
    beginTileDragCheckpoint,
    bounds,
    canRedo,
    canUndo,
    cancelTileDragCheckpoint,
    commitTileDragCheckpoint,
    getLayoutSnapshot,
    getTileDragSnapshot,
    getVideosForSnapshot,
    insertTilesAtPositions,
    movedTileIds,
    placeTilesAtWorldPoint,
    redoTiles,
    removeTilesByIds,
    repositionTiles,
    replaceTilesWithPaste,
    resetTileState,
    restoreTileState,
    revertTileDragCheckpoint,
    tiles,
    undoTiles,
  } = useCanvasTiles({
    getPlaylistSources: () => playlistSourcesRef.current,
    onLayoutCommitted: () => {
      discardClearHistoryRef.current();
    },
    onPlaylistSourcesRestore: syncPlaylistSources,
  });

  const isTileEnterActive = useCanvasTileEnter(tiles.length, playlistStatus);

  const tilesLayoutKey = useMemo(
    () =>
      tiles
        .map((tile) => `${tile.id}:${tile.x.toFixed(1)},${tile.y.toFixed(1)}`)
        .join("|"),
    [tiles],
  );

  const {
    clearTileSelection,
    selectedTileIdsRef,
    setSelectedTileIds,
    validSelectedTileIds,
  } = useCanvasSelection(tiles);

  const {
    didCenterInitialTilesRef,
    pendingCenterRectRef,
    setCenterPlaylistRequest,
    viewportRef,
    viewportSize,
    visibleTiles,
  } = useCanvasViewport({
    bounds,
    centerCameraOnRect,
    getLiveCamera,
    movedTileIds,
    tiles,
  });

  const {
    buildCurrentCanvasSnapshot,
    canRedoClear,
    canSave,
    canUndoClear,
    clearCanvas,
    discardClearHistory,
    importCanvasLayout,
    redoClear,
    saveCanvasNow,
    saveCanvasSilently,
    undoClear,
  } = useCanvasPersistence({
    camera,
    getLayoutSnapshot,
    getLiveCamera,
    getPlaylistSources: () => playlistSourcesRef.current,
    getVideosForSnapshot,
    hasTiles: tiles.length > 0,
    onCanvasClear: () => {
      setSelectedTileIds(new Set());
      didCenterInitialTilesRef.current = false;
      pendingCenterRectRef.current = null;
      setCenterPlaylistRequest((currentRequest) => currentRequest + 1);
      showNotification("layout cleared");
    },
    onClearUndo: (sources) => {
      didCenterInitialTilesRef.current = true;
      syncPlaylistSources(sources);
      setSelectedTileIds(new Set());
      showNotification("layout restored");
    },
    onManualSave: (result) => {
      if (result === "saved") {
        showNotification("layout saved");
        return;
      }

      if (result === "no-playlist") {
        showNotification("load a playlist to save");
        return;
      }

      showNotification("could not save layout");
    },
    onRestoreComplete: (sources) => {
      didCenterInitialTilesRef.current = true;
      syncPlaylistSources(sources);
    },
    playlistSourcesKey,
    resetCamera,
    resetTileState,
    restoreCamera,
    restoreTileState,
    setPlaylistSources: syncPlaylistSources,
    tilesLayoutKey,
  });

  discardClearHistoryRef.current = discardClearHistory;

  const canUndoLayout = canUndo || canUndoClear;
  const canRedoLayout = canRedo || canRedoClear;

  const handleUndoLayout = useCallback(() => {
    if (canUndoClear) {
      undoClear();
      return;
    }

    if (canUndo) {
      undoTiles();
    }
  }, [canUndo, canUndoClear, undoClear, undoTiles]);

  const handleRedoLayout = useCallback(() => {
    if (canRedoClear) {
      redoClear();
      return;
    }

    if (canRedo) {
      redoTiles();
    }
  }, [canRedo, canRedoClear, redoClear, redoTiles]);

  const handleDeleteTiles = useCallback(() => {
    if (validSelectedTileIds.size === 0) {
      return false;
    }

    beginTileDragCheckpoint();
    const removedCount = removeTilesByIds(validSelectedTileIds);

    if (removedCount === 0) {
      cancelTileDragCheckpoint();
      return false;
    }

    commitTileDragCheckpoint();
    saveCanvasSilently();
    setSelectedTileIds(new Set());

    const tileLabel = removedCount === 1 ? "tile" : "tiles";
    showNotification(`${removedCount} ${tileLabel} deleted`);

    return true;
  }, [
    beginTileDragCheckpoint,
    cancelTileDragCheckpoint,
    commitTileDragCheckpoint,
    removeTilesByIds,
    saveCanvasSilently,
    setSelectedTileIds,
    showNotification,
    validSelectedTileIds,
  ]);

  const handleOrderSelectedTiles = useCallback(
    async (criterion: TileOrderCriterion) => {
      if (validSelectedTileIds.size < 2) {
        showNotification("select at least two tiles to order");
        return;
      }

      const selectedTiles = tiles.filter((tile) =>
        validSelectedTileIds.has(tile.id),
      );

      if (selectedTiles.length < 2) {
        showNotification("select at least two tiles to order");
        return;
      }

      if (criterion === "color") {
        showNotification("ordering by color…");
      }

      let sortedTiles = selectedTiles;

      try {
        if (criterion === "color") {
          sortedTiles = await sortTilesByColor(selectedTiles);
        } else if (criterion === "artist") {
          sortedTiles = sortTilesByArtist(selectedTiles);
        } else {
          sortedTiles = sortTilesByDate(selectedTiles);
        }
      } catch {
        showNotification("could not order selected tiles");
        return;
      }

      const positionUpdates = buildOrderedTilePositions(
        sortedTiles,
        selectedTiles,
      );

      beginTileDragCheckpoint();
      repositionTiles(positionUpdates);
      commitTileDragCheckpoint();
      saveCanvasSilently();

      const tileLabel = selectedTiles.length === 1 ? "tile" : "tiles";
      showNotification(
        `ordered ${selectedTiles.length} ${tileLabel} by ${getTileOrderCriterionLabel(criterion)}`,
      );
    },
    [
      beginTileDragCheckpoint,
      commitTileDragCheckpoint,
      repositionTiles,
      saveCanvasSilently,
      showNotification,
      tiles,
      validSelectedTileIds,
    ],
  );

  const {
    clipboardRevision,
    ensureClipboardPayload,
    handleCopyTiles,
    handlePasteTiles,
    performPaste,
    tileClipboardRef,
  } = useCanvasClipboard({
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
  });

  const {
    closeContextMenu,
    contextMenuState,
    contextMenuStateRef,
    handleContextMenuPaste,
    menuCanPaste,
    setContextMenuState,
  } = useCanvasContextMenu({
    clipboardRevision,
    ensureClipboardPayload,
    performPaste,
    tileClipboardRef,
  });

  const { keyboardActionsRef } = useCanvasKeyboardShortcuts({
    selectedTileIdsRef,
  });

  keyboardActionsRef.current = {
    canRedoLayout,
    canUndoLayout,
    clearCanvas,
    clearTileSelection,
    handleCopyTiles,
    handleDeleteTiles,
    handlePasteTiles,
    handleRedoLayout,
    handleUndoLayout,
    saveCanvasNow,
  };

  const pointer = useCanvasPointerInteractions({
    beginTileDragCheckpoint,
    cancelTileDragCheckpoint,
    closeContextMenu,
    commitTileDragCheckpoint,
    contextMenuStateRef,
    getLiveCamera,
    getTileDragSnapshot,
    panBy,
    placeTilesAtWorldPoint,
    revertTileDragCheckpoint,
    saveCanvasSilently,
    selectedTileIdsRef,
    setContextMenuState,
    setSelectedTileIds,
    syncCamera,
    tiles,
    viewportRef,
    zoomAtPoint,
  });

  useEffect(() => {
    if (tiles.length === 0 && playlistSources.length > 0) {
      syncPlaylistSources([]);
    }
  }, [playlistSources.length, syncPlaylistSources, tiles.length]);

  useEffect(() => {
    function handleWindowBlur() {
      pointer.setPointerModifiers((currentModifiers) => ({
        ...currentModifiers,
        primaryDown: false,
      }));
    }

    window.addEventListener("blur", handleWindowBlur);

    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [pointer]);

  useEffect(() => {
    if (playlistStatus !== "loading") {
      return;
    }

    const slowLoadTimer = setTimeout(() => {
      setIsSlowPlaylistLoad(true);
    }, 1000);

    return () => clearTimeout(slowLoadTimer);
  }, [playlistStatus]);

  const handleClearPlaylistCache = useCallback(() => {
    const clearedCount = clearAllPlaylistVideoCache();

    if (clearedCount === 0) {
      showNotification("playlist cache already empty");
      return;
    }

    const label = clearedCount === 1 ? "entry" : "entries";
    showNotification(`cleared ${clearedCount} cached playlist ${label}`);
  }, [showNotification]);

  const handleClearSavedLayout = useCallback(() => {
    clearCanvasSnapshot();
    showNotification("saved layout cleared");
  }, [showNotification]);

  const handleCanvasExport = useCallback(
    (basename: string) => {
      const snapshot = buildCurrentCanvasSnapshot();

      if (!snapshot) {
        showNotification("load a playlist to export");
        return;
      }

      downloadCanvasSnapshotFile(snapshot, basename);
      showNotification("layout exported");
    },
    [buildCurrentCanvasSnapshot, showNotification],
  );

  const handleCanvasImport = useCallback(
    async (file: File) => {
      if (tiles.length > 0) {
        const shouldReplace = window.confirm(
          "Replace your current canvas with the imported layout?",
        );

        if (!shouldReplace) {
          return;
        }
      }

      let fileText = "";

      try {
        fileText = await file.text();
      } catch {
        showNotification("could not read layout file");
        return;
      }

      const snapshot = parseCanvasSnapshotFile(fileText);

      if (!snapshot) {
        showNotification("invalid layout file");
        return;
      }

      const didImport = importCanvasLayout(snapshot);

      if (!didImport) {
        showNotification("layout file is empty");
        return;
      }

      setSelectedTileIds(new Set());
      pendingCenterRectRef.current = null;
      setCenterPlaylistRequest((currentRequest) => currentRequest + 1);

      const tileLabel = snapshot.videos.length === 1 ? "tile" : "tiles";
      showNotification(`imported ${snapshot.videos.length} ${tileLabel}`);
    },
    [
      importCanvasLayout,
      setCenterPlaylistRequest,
      setSelectedTileIds,
      showNotification,
      tiles.length,
    ],
  );

  async function handlePlaylistLoad(playlist: string) {
    setIsSlowPlaylistLoad(false);
    const trimmedPlaylist = playlist.trim();

    if (playlistSourcesInclude(playlistSourcesRef.current, trimmedPlaylist)) {
      showNotification("playlist already on canvas");
      return;
    }

    const fetchedVideos = await fetchPlaylist(trimmedPlaylist);

    if (!fetchedVideos || fetchedVideos.length === 0) {
      return;
    }

    discardClearHistory();

    beginTileDragCheckpoint();
    const batchId = crypto.randomUUID().slice(0, 8);
    const batchBounds = appendPlaylistTiles(fetchedVideos, batchId);

    syncPlaylistSources((currentSources) => [...currentSources, trimmedPlaylist]);
    commitTileDragCheckpoint();
    saveCanvasSilently();

    setSelectedTileIds(new Set());
    pendingCenterRectRef.current = batchBounds;
    setCenterPlaylistRequest((currentRequest) => currentRequest + 1);

    const videoLabel = fetchedVideos.length === 1 ? "video" : "videos";
    showNotification(`${fetchedVideos.length} ${videoLabel} added`);
  }

  return {
    areVideoDetailsHidden,
    bounds,
    camera,
    canRedoLayout,
    canSave,
    canUndoLayout,
    clearCanvas,
    contextMenuState,
    closeContextMenu,
    errorMessage,
    handleCanvasExport,
    handleCanvasImport,
    handleClearPlaylistCache,
    handleClearSavedLayout,
    handleContextMenuPaste,
    handleCopyTiles,
    handleDeleteTiles,
    handleOrderSelectedTiles,
    handlePlaylistLoad,
    handleRedoLayout,
    handleUndoLayout,
    isPlaylistPickerOpen,
    isShortcutLegendVisible,
    isSlowPlaylistLoad,
    isTileEnterActive,
    loadNotification,
    menuCanPaste,
    playlistStatus,
    pointer,
    saveCanvasNow,
    setAreVideoDetailsHidden,
    setIsPlaylistPickerOpen,
    setIsShortcutLegendVisible,
    tiles,
    validSelectedTileIds,
    viewportRef,
    visibleTiles,
    worldLayerRef,
  };
}
