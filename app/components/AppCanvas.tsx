"use client";

import Image from "next/image";
import type { MouseEvent, PointerEvent, WheelEvent } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCanvasCamera } from "../hooks/useCanvasCamera";
import { useCanvasPersistence } from "../hooks/useCanvasPersistence";
import { useCanvasTiles } from "../hooks/useCanvasTiles";
import { usePlaylistVideos } from "../hooks/usePlaylistVideos";
import {
  applyTileSnap,
  buildGrabOffsets,
  getVisibleCanvasTiles,
  getVisibleWorldRect,
  normalizeRect,
  rectsIntersect,
  screenToWorld,
  type CanvasTile,
  type Point,
  type Rect,
  type ViewportSize,
} from "../lib/canvas-layout";
import { playlistSourcesInclude } from "../lib/playlist-source";
import {
  buildPastedTileEntries,
  buildPastedTileEntriesAtWorldPoint,
  buildReplacePasteEntries,
  buildTileClipboardPayload,
  parseTileClipboardText,
  serializeTileClipboardPayload,
  sortTilesByPosition,
  type TileClipboardPayload,
} from "../lib/tile-clipboard";
import { AppToolbar } from "./AppToolbar";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { CanvasEmptyState } from "./CanvasEmptyState";
import {
  CanvasShortcutLegend,
  type CanvasInteraction,
} from "./CanvasShortcutLegend";
import { SelectionBox } from "./SelectionBox";
import { type HoveredVideoDetails, VideoGrid } from "./VideoGrid";

const tileDragThreshold = 4;
const tileDoubleClickWindowMs = 400;
const toastVisibleMs = 1800;

type ToastNotice = {
  id: number;
  message: string;
};

type ContextMenuState = {
  clientX: number;
  clientY: number;
  replaceTileIds: string[];
  worldPoint: Point;
};

type DragMode =
  | {
      type: "pan";
      pointerId: number;
    }
  | {
      type: "moveTiles";
      pointerId: number;
      tileIds: Set<string>;
      grabOffsets: Map<string, Point>;
    }
  | {
      type: "pendingTile";
      pointerId: number;
      tileIds: Set<string>;
      startScreenPoint: Point;
    }
  | {
      type: "selectBox";
      pointerId: number;
      startWorldPoint: Point;
      currentWorldPoint: Point;
    };

// toolbar controls and video links should not start a pan
function isInteractiveElement(target: EventTarget) {
  return (
    target instanceof Element && Boolean(target.closest("a, button, input"))
  );
}

function isEditableTarget(target: EventTarget) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest("input, textarea, select, [contenteditable='true']") !== null)
  );
}

export function AppCanvas() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const didCenterInitialTilesRef = useRef(false);
  const centeredPlaylistRequestRef = useRef(0);
  const pendingCenterRectRef = useRef<Rect | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const notificationIdRef = useRef(0);
  const [centerPlaylistRequest, setCenterPlaylistRequest] = useState(0);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [areVideoDetailsHidden, setAreVideoDetailsHidden] = useState(false);
  const [hoveredVideoDetails, setHoveredVideoDetails] =
    useState<HoveredVideoDetails | null>(null);
  const [isSlowPlaylistLoad, setIsSlowPlaylistLoad] = useState(false);
  const [loadNotification, setLoadNotification] = useState<ToastNotice | null>(
    null,
  );

  const showNotification = useCallback((message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    notificationIdRef.current += 1;
    const toastId = notificationIdRef.current;

    setLoadNotification({ id: toastId, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setLoadNotification((currentToast) =>
        currentToast?.id === toastId ? null : currentToast,
      );
      notificationTimeoutRef.current = null;
    }, toastVisibleMs);
  }, []);
  const [playlistSources, setPlaylistSources] = useState<string[]>([]);
  const playlistSourcesRef = useRef(playlistSources);
  playlistSourcesRef.current = playlistSources;

  const syncPlaylistSources = useCallback(
    (next: string[] | ((previous: string[]) => string[])) => {
      setPlaylistSources((previous) => {
        const resolved =
          typeof next === "function" ? next(previous) : next;
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

  const [viewportSize, setViewportSize] = useState<ViewportSize | null>(null);
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState | null>(
    null,
  );
  const contextMenuStateRef = useRef(contextMenuState);
  contextMenuStateRef.current = contextMenuState;
  const [clipboardRevision, setClipboardRevision] = useState(0);
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pointerModifiers, setPointerModifiers] = useState({
    alt: false,
    mod: false,
    primaryDown: false,
    shift: false,
  });
  const panLastScreenPointRef = useRef<Point | null>(null);
  const lastTileClickRef = useRef<{
    screenPoint: Point;
    tileId: string;
    time: number;
  } | null>(null);
  const tileClipboardRef = useRef<{
    pasteCount: number;
    payload: TileClipboardPayload;
  } | null>(null);
  const selectedTileIdsRef = useRef(selectedTileIds);
  selectedTileIdsRef.current = selectedTileIds;

  const keyboardActionsRef = useRef<{
    canRedo: boolean;
    canRedoLayout: boolean;
    canUndoLayout: boolean;
    clearCanvas: () => void;
    clearTileSelection: () => void;
    handleCopyTiles: () => boolean;
    handleDeleteTiles: () => boolean;
    handlePasteTiles: () => Promise<boolean>;
    handleRedoLayout: () => void;
    handleUndoLayout: () => void;
    redoTiles: () => void;
    saveCanvasNow: () => void;
  }>({
    canRedo: false,
    canRedoLayout: false,
    canUndoLayout: false,
    clearCanvas: () => {},
    clearTileSelection: () => {},
    handleCopyTiles: () => false,
    handleDeleteTiles: () => false,
    handlePasteTiles: async () => false,
    handleRedoLayout: () => {},
    handleUndoLayout: () => {},
    redoTiles: () => {},
    saveCanvasNow: () => {},
  });
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

  const tilesLayoutKey = useMemo(
    () =>
      tiles
        .map((tile) => `${tile.id}:${tile.x.toFixed(1)},${tile.y.toFixed(1)}`)
        .join("|"),
    [tiles],
  );

  useEffect(() => {
    setSelectedTileIds((currentSelection) => {
      if (currentSelection.size === 0) {
        return currentSelection;
      }

      const existingTileIds = new Set(tiles.map((tile) => tile.id));
      const nextSelection = new Set(
        [...currentSelection].filter((tileId) => existingTileIds.has(tileId)),
      );

      if (nextSelection.size === currentSelection.size) {
        return currentSelection;
      }

      return nextSelection;
    });
  }, [tiles]);

  const {
    canRedoClear,
    canSave,
    canUndoClear,
    clearCanvas,
    discardClearHistory,
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

  useEffect(() => {
    if (tiles.length === 0 && playlistSources.length > 0) {
      syncPlaylistSources([]);
    }
  }, [playlistSources.length, syncPlaylistSources, tiles.length]);

  const handleDeleteTiles = useCallback(() => {
    if (selectedTileIds.size === 0) {
      return false;
    }

    beginTileDragCheckpoint();
    const removedCount = removeTilesByIds(selectedTileIds);

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
    selectedTileIds,
    showNotification,
  ]);

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

  const clearTileSelection = useCallback(() => {
    setSelectedTileIds(new Set());
  }, []);

  const handleCopyTiles = useCallback(() => {
    const selectedTiles = tiles.filter((tile) => selectedTileIds.has(tile.id));
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
  }, [selectedTileIds, tiles]);

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
      showNotification,
      tiles,
    ],
  );

  const handlePasteTiles = useCallback(async () => {
    if (selectedTileIds.size > 0) {
      return performPaste({ replaceTileIds: [...selectedTileIds] });
    }

    return performPaste({});
  }, [performPaste, selectedTileIds]);

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

  const [menuCanPaste, setMenuCanPaste] = useState(false);

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
  }, [contextMenuState, clipboardRevision, ensureClipboardPayload]);

  function syncPointerModifiers(
    event: {
      altKey: boolean;
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
    },
    primaryDown?: boolean,
  ) {
    setPointerModifiers((currentModifiers) => ({
      alt: event.altKey,
      shift: event.shiftKey,
      mod: event.ctrlKey || event.metaKey,
      primaryDown: primaryDown ?? currentModifiers.primaryDown,
    }));
  }

  const activeCanvasInteraction = useMemo((): CanvasInteraction => {
    if (!dragMode) {
      return null;
    }

    if (dragMode.type === "pan") {
      return "pan";
    }

    if (dragMode.type === "moveTiles" || dragMode.type === "pendingTile") {
      return "moveTiles";
    }

    return null;
  }, [dragMode]);

  function screenPointToWorld(screenPoint: Point) {
    return screenToWorld(screenPoint, getLiveCamera());
  }
  const selectionRect = getSelectionRect(dragMode);
  const movingTileIds =
    dragMode?.type === "moveTiles" ? dragMode.tileIds : new Set<string>();
  const visibleTiles = useMemo(() => {
    if (!viewportSize) {
      return [];
    }

    const liveCamera = getLiveCamera();

    return getVisibleCanvasTiles({
      tiles,
      cameraZoom: liveCamera.zoom,
      movedTileIds,
      visibleRect: getVisibleWorldRect({
        camera: liveCamera,
        viewportSize,
      }),
    });
  }, [camera, getLiveCamera, movedTileIds, tiles, viewportSize]);

  useLayoutEffect(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    function updateViewportSize() {
      setViewportSize(getViewportSize(viewportElement));
    }

    updateViewportSize();

    const resizeObserver = new ResizeObserver(updateViewportSize);
    resizeObserver.observe(viewportElement);

    return () => resizeObserver.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!viewportSize || tiles.length === 0) {
      return;
    }

    const shouldCenterInitialTiles = !didCenterInitialTilesRef.current;
    const shouldCenterLoadedPlaylist =
      centerPlaylistRequest > centeredPlaylistRequestRef.current;

    if (!shouldCenterInitialTiles && !shouldCenterLoadedPlaylist) {
      return;
    }

    const rectToCenter = pendingCenterRectRef.current ?? bounds;
    centerCameraOnRect(rectToCenter, viewportSize);
    pendingCenterRectRef.current = null;
    didCenterInitialTilesRef.current = true;
    centeredPlaylistRequestRef.current = centerPlaylistRequest;
  }, [bounds, centerCameraOnRect, centerPlaylistRequest, tiles.length, viewportSize]);

  useEffect(() => {
    return () => {
      // clear the toast timer if the canvas unmounts mid-animation
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleWindowBlur() {
      setPointerModifiers((currentModifiers) => ({
        ...currentModifiers,
        primaryDown: false,
      }));
    }

    window.addEventListener("blur", handleWindowBlur);

    return () => window.removeEventListener("blur", handleWindowBlur);
  }, []);

  useEffect(() => {
    if (playlistStatus !== "loading") {
      return;
    }

    const slowLoadTimer = setTimeout(() => {
      setIsSlowPlaylistLoad(true);
    }, 1000);

    return () => clearTimeout(slowLoadTimer);
  }, [playlistStatus]);

  keyboardActionsRef.current = {
    canRedo,
    canRedoLayout,
    canUndoLayout,
    clearCanvas,
    clearTileSelection,
    handleCopyTiles,
    handleDeleteTiles,
    handlePasteTiles,
    handleRedoLayout,
    handleUndoLayout,
    redoTiles,
    saveCanvasNow,
  };

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
  }, []);

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

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isInteractiveElement(event.target)) {
      return;
    }

    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    if (contextMenuStateRef.current) {
      closeContextMenu();
    }

    syncPointerModifiers(event, event.button === 0);

    const screenPoint = getViewportPoint(event, viewportRef.current);
    const worldPoint = screenPointToWorld(screenPoint);

    // keep receiving pointer moves even if the cursor moves fast
    viewportRef.current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (shouldPanCanvas(event)) {
      panLastScreenPointRef.current = screenPoint;
      setDragMode({
        type: "pan",
        pointerId: event.pointerId,
      });
      return;
    }

    setSelectedTileIds(new Set());
    setDragMode({
      type: "selectBox",
      pointerId: event.pointerId,
      startWorldPoint: worldPoint,
      currentWorldPoint: worldPoint,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    syncPointerModifiers(event);

    if (!dragMode || dragMode.pointerId !== event.pointerId) {
      return;
    }

    const screenPoint = getViewportPoint(event, viewportRef.current);
    const worldPoint = screenPointToWorld(screenPoint);

    if (dragMode.type === "pan") {
      const lastScreenPoint = panLastScreenPointRef.current;

      if (lastScreenPoint) {
        panBy({
          x: screenPoint.x - lastScreenPoint.x,
          y: screenPoint.y - lastScreenPoint.y,
        });
      }

      panLastScreenPointRef.current = screenPoint;
      return;
    }

    if (dragMode.type === "moveTiles") {
      placeTilesAtWorldPoint(
        dragMode.tileIds,
        getTilePlacementPoint(
          worldPoint,
          event.shiftKey,
          dragMode.tileIds,
          dragMode.grabOffsets,
          getTileDragSnapshot().tiles,
        ),
        dragMode.grabOffsets,
      );
      return;
    }

    if (dragMode.type === "pendingTile") {
      const movedDistance = getDistance(dragMode.startScreenPoint, screenPoint);

      if (movedDistance < tileDragThreshold) {
        return;
      }

      const grabOffsets = buildGrabOffsets(
        dragMode.tileIds,
        getTileDragSnapshot().tiles,
        worldPoint,
      );

      placeTilesAtWorldPoint(
        dragMode.tileIds,
        getTilePlacementPoint(
          worldPoint,
          event.shiftKey,
          dragMode.tileIds,
          grabOffsets,
          getTileDragSnapshot().tiles,
        ),
        grabOffsets,
      );
      viewportRef.current?.setPointerCapture(event.pointerId);
      setDragMode({
        type: "moveTiles",
        pointerId: dragMode.pointerId,
        tileIds: dragMode.tileIds,
        grabOffsets,
      });
      return;
    }

    setDragMode({
      ...dragMode,
      currentWorldPoint: worldPoint,
    });
  }

  function endActiveDrag(
    endedDragMode: DragMode,
    outcome: "commit" | "cancel",
  ) {
    if (endedDragMode.type === "pan") {
      syncCamera();
      panLastScreenPointRef.current = null;
      return;
    }

    if (outcome === "commit" && endedDragMode.type === "selectBox") {
      const rect = normalizeRect(
        endedDragMode.startWorldPoint,
        endedDragMode.currentWorldPoint,
      );
      setSelectedTileIds(getTilesInsideRect(tiles, rect));
    }

    if (endedDragMode.type === "moveTiles") {
      if (outcome === "commit") {
        commitTileDragCheckpoint();
        saveCanvasSilently();
      } else {
        revertTileDragCheckpoint();
      }
      return;
    }

    if (
      endedDragMode.type === "pendingTile" ||
      endedDragMode.type === "selectBox"
    ) {
      cancelTileDragCheckpoint();
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.button === 0) {
      syncPointerModifiers(event, false);
    }

    if (!dragMode || dragMode.pointerId !== event.pointerId) {
      return;
    }

    endActiveDrag(dragMode, "commit");
    setDragMode(null);
  }

  function handleTilePointerDown(
    event: PointerEvent<HTMLDivElement>,
    tile: CanvasTile,
  ) {
    if (event.button !== 0) {
      return;
    }

    if (contextMenuStateRef.current) {
      closeContextMenu();
    }

    syncPointerModifiers(event, true);
    event.stopPropagation();

    const startScreenPoint = getViewportPoint(event, viewportRef.current);

    if (isTileDoubleClick(tile.id, startScreenPoint, lastTileClickRef.current)) {
      lastTileClickRef.current = null;
      handleTileDoubleClick(tile, "pointer-detail");
      return;
    }

    lastTileClickRef.current = {
      screenPoint: startScreenPoint,
      tileId: tile.id,
      time: Date.now(),
    };

    const nextSelectedTileIds = getNextSelectedTileIds({
      isAdditive: event.ctrlKey || event.metaKey,
      selectedTileIds,
      tileId: tile.id,
    });

    beginTileDragCheckpoint();
    setSelectedTileIds(nextSelectedTileIds);
    setDragMode({
      type: "pendingTile",
      pointerId: event.pointerId,
      tileIds: nextSelectedTileIds,
      startScreenPoint,
    });
  }

  function handleTileDoubleClick(
    tile: CanvasTile,
    source: "pointer-detail" | "react-double-click",
  ) {
    const openedWindow = window.open(tile.video.url, "_blank", "noreferrer");
    void openedWindow;
    void source;
    setDragMode(null);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const rect = viewportRef.current?.getBoundingClientRect();
    const zoomDirection = event.deltaY > 0 ? -1 : 1;

    // wheel zooms toward the cursor, like a canvas
    zoomAtPoint(
      {
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
      },
      getLiveCamera().zoom + zoomDirection * 0.12,
    );
    syncCamera();
  }

  function openContextMenu(
    clientX: number,
    clientY: number,
    replaceTileIds: string[],
  ) {
    const screenPoint = getViewportPointFromClient(
      clientX,
      clientY,
      viewportRef.current,
    );

    setContextMenuState({
      clientX,
      clientY,
      replaceTileIds,
      worldPoint: screenPointToWorld(screenPoint),
    });
  }

  function handleViewportContextMenu(event: MouseEvent<HTMLDivElement>) {
    if (isInteractiveElement(event.target)) {
      return;
    }

    event.preventDefault();
    setSelectedTileIds(new Set());
    openContextMenu(event.clientX, event.clientY, []);
  }

  function handleTileContextMenu(
    event: MouseEvent<HTMLDivElement>,
    tile: CanvasTile,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const nextSelectedTileIds = getNextSelectedTileIds({
      isAdditive: event.ctrlKey || event.metaKey,
      selectedTileIds,
      tileId: tile.id,
    });

    setSelectedTileIds(nextSelectedTileIds);
    openContextMenu(event.clientX, event.clientY, [...nextSelectedTileIds]);
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#111111] text-white">
      <AppToolbar
        areVideoDetailsHidden={areVideoDetailsHidden}
        errorMessage={errorMessage}
        hasTilesOnCanvas={tiles.length > 0}
        canRedo={canRedoLayout}
        canSave={canSave}
        canUndo={canUndoLayout}
        onCanvasClear={clearCanvas}
        onCanvasRedo={handleRedoLayout}
        onCanvasSave={saveCanvasNow}
        onCanvasUndo={handleUndoLayout}
        onPlaylistLoad={handlePlaylistLoad}
        onVideoDetailsToggle={() =>
          setAreVideoDetailsHidden((currentValue) => !currentValue)
        }
        playlistStatus={playlistStatus}
      />

      {tiles.length === 0 && playlistStatus !== "loading" ? (
        <CanvasEmptyState />
      ) : null}

      <div
        className={`absolute inset-0 touch-none select-none bg-[radial-gradient(circle,_rgba(255,255,255,0.16)_1px,_transparent_1px)] [background-size:20px_20px] ${
          dragMode?.type === "pan" ? "cursor-grabbing" : "cursor-crosshair"
        }`}
        onContextMenu={handleViewportContextMenu}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setPointerModifiers((currentModifiers) => ({
            ...currentModifiers,
            primaryDown: false,
          }));

          if (dragMode) {
            endActiveDrag(dragMode, "cancel");
          }

          setDragMode(null);
        }}
        onWheel={handleWheel}
        ref={viewportRef}
        tabIndex={-1}
      >
        <div
          className="origin-top-left will-change-transform"
          ref={worldLayerRef}
        >
          <VideoGrid
            bounds={bounds}
            cameraZoom={camera.zoom}
            movingTileIds={movingTileIds}
            onTileDoubleClick={handleTileDoubleClick}
            onVideoHover={setHoveredVideoDetails}
            onVideoHoverEnd={() => setHoveredVideoDetails(null)}
            onTileContextMenu={handleTileContextMenu}
            onTilePointerDown={handleTilePointerDown}
            selectedTileIds={selectedTileIds}
            visibleTiles={visibleTiles}
          />
          {selectionRect ? <SelectionBox rect={selectionRect} /> : null}
        </div>
      </div>

      {hoveredVideoDetails && !areVideoDetailsHidden ? (
        <aside className="pointer-events-none fixed bottom-5 left-5 z-20 flex max-w-2xl gap-4 rounded-md border border-white/15 bg-[#111111]/45 p-3 shadow-2xl backdrop-blur-sm">
          <span className="font-control absolute right-3 top-3 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/60">
            {String(hoveredVideoDetails.index + 1).padStart(2, "0")}
          </span>

          {hoveredVideoDetails.video.thumbnailUrl ? (
            <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded bg-white/5">
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="144px"
                src={hoveredVideoDetails.video.thumbnailUrl}
              />
            </div>
          ) : null}

          <div className="min-w-0 self-center pr-10">
            {hoveredVideoDetails.video.channelTitle ? (
              <p className="font-control mb-2 text-[10px] uppercase tracking-[0.24em] text-white/55">
                {hoveredVideoDetails.video.channelTitle}
              </p>
            ) : null}
            <p className="font-control text-sm font-semibold leading-5 text-white drop-shadow">
              {hoveredVideoDetails.video.title}
            </p>
            <p className="font-control mt-2 text-[10px] uppercase tracking-[0.24em] text-white/45">
              double-click thumbnail to open
            </p>
          </div>
        </aside>
      ) : null}

      <CanvasShortcutLegend
        activeInteraction={activeCanvasInteraction}
        pointerModifiers={pointerModifiers}
      />

      {playlistStatus === "loading" && isSlowPlaylistLoad ? (
        <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
          <div className="w-72 rounded-2xl border border-white/15 bg-[#111111]/70 p-4 shadow-2xl backdrop-blur-md">
            <p className="font-control mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-white/65">
              loading playlist
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="playlist-request-loading-bar h-full rounded-full" />
            </div>
          </div>
        </div>
      ) : null}

      {contextMenuState ? (
        <CanvasContextMenu
          canCopy={contextMenuState.replaceTileIds.length > 0}
          canPaste={menuCanPaste}
          clientX={contextMenuState.clientX}
          clientY={contextMenuState.clientY}
          onClose={closeContextMenu}
          onCopy={handleCopyTiles}
          onPaste={() => {
            void handleContextMenuPaste();
          }}
        />
      ) : null}

      {loadNotification ? (
        <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
          <div
            key={loadNotification.id}
            className="playlist-loaded-toast rounded-full border border-[#CA3E47]/50 bg-[#111111]/65 px-5 py-3 shadow-2xl backdrop-blur-md"
          >
            <p className="font-control text-xs font-semibold uppercase tracking-[0.28em] text-white">
              {loadNotification.message}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function getViewportPoint(
  event: PointerEvent<Element>,
  viewportElement: HTMLElement | null,
): Point {
  return getViewportPointFromClient(
    event.clientX,
    event.clientY,
    viewportElement,
  );
}

function getViewportPointFromClient(
  clientX: number,
  clientY: number,
  viewportElement: HTMLElement | null,
): Point {
  const rect = viewportElement?.getBoundingClientRect();

  return {
    x: clientX - (rect?.left ?? 0),
    y: clientY - (rect?.top ?? 0),
  };
}

function getViewportSize(viewportElement: HTMLElement | null) {
  const rect = viewportElement?.getBoundingClientRect();

  if (!rect) {
    return null;
  }

  return {
    height: rect.height,
    width: rect.width,
  };
}

function getDistance(firstPoint: Point, secondPoint: Point) {
  return Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y);
}

type TileClickRecord = {
  screenPoint: Point;
  tileId: string;
  time: number;
};

function isTileDoubleClick(
  tileId: string,
  screenPoint: Point,
  lastClick: TileClickRecord | null,
) {
  if (!lastClick || lastClick.tileId !== tileId) {
    return false;
  }

  const elapsedMs = Date.now() - lastClick.time;

  return (
    elapsedMs <= tileDoubleClickWindowMs &&
    getDistance(lastClick.screenPoint, screenPoint) <= tileDragThreshold
  );
}

function getTilePlacementPoint(
  worldPoint: Point,
  shouldSnap: boolean,
  tileIds: Set<string>,
  grabOffsets: Map<string, Point>,
  tiles: CanvasTile[],
) {
  if (!shouldSnap) {
    return worldPoint;
  }

  return applyTileSnap(worldPoint, tileIds, grabOffsets, tiles);
}

function shouldPanCanvas(event: PointerEvent<Element>) {
  return event.altKey || event.button === 1;
}

function getSelectionRect(dragMode: DragMode | null): Rect | null {
  if (dragMode?.type !== "selectBox") {
    return null;
  }

  return normalizeRect(dragMode.startWorldPoint, dragMode.currentWorldPoint);
}

function getTilesInsideRect(tiles: CanvasTile[], rect: Rect) {
  const selectedIds = new Set<string>();

  for (const tile of tiles) {
    if (rectsIntersect(tile, rect)) {
      selectedIds.add(tile.id);
    }
  }

  return selectedIds;
}

function getNextSelectedTileIds({
  isAdditive,
  selectedTileIds,
  tileId,
}: {
  isAdditive: boolean;
  selectedTileIds: Set<string>;
  tileId: string;
}) {
  if (!isAdditive) {
    return selectedTileIds.has(tileId) ? selectedTileIds : new Set([tileId]);
  }

  const nextSelectedTileIds = new Set(selectedTileIds);

  if (nextSelectedTileIds.has(tileId)) {
    nextSelectedTileIds.delete(tileId);
  } else {
    nextSelectedTileIds.add(tileId);
  }

  return nextSelectedTileIds;
}
