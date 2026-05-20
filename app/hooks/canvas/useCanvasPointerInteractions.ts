"use client";

import {
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from "react";
import type { CanvasInteraction } from "../../components/canvas/CanvasShortcutLegend";
import {
  buildGrabOffsets,
  screenToWorld,
  type CanvasTile,
  type Point,
} from "../../lib/canvas/canvas-layout";
import {
  getNextSelectedTileIds,
  resolveMarqueeSelection,
} from "../../lib/canvas/canvas-selection";
import {
  getSelectionRect,
  getTilePlacementPoint,
  isInteractiveElement,
  isTileDoubleClick,
  shouldPanCanvas,
  tileDragThreshold,
} from "../../lib/canvas/canvas-input";
import {
  getDistance,
  getViewportPoint,
  getViewportPointFromClient,
} from "../../lib/canvas/canvas-viewport";
import type {
  ContextMenuState,
  DragMode,
  TileClickRecord,
} from "../../types/canvas-interaction";

type UseCanvasPointerInteractionsOptions = {
  beginTileDragCheckpoint: () => void;
  cancelTileDragCheckpoint: () => void;
  closeContextMenu: () => void;
  commitTileDragCheckpoint: () => void;
  contextMenuStateRef: RefObject<ContextMenuState | null>;
  getLiveCamera: () => { x: number; y: number; zoom: number };
  getTileDragSnapshot: () => { tiles: CanvasTile[] };
  panBy: (delta: Point) => void;
  placeTilesAtWorldPoint: (
    tileIds: Set<string>,
    worldPoint: Point,
    grabOffsets: Map<string, Point>,
  ) => void;
  revertTileDragCheckpoint: () => void;
  saveCanvasSilently: () => void;
  selectedTileIdsRef: RefObject<Set<string>>;
  setContextMenuState: (state: ContextMenuState) => void;
  setSelectedTileIds: (tileIds: Set<string>) => void;
  syncCamera: () => void;
  tiles: CanvasTile[];
  viewportRef: RefObject<HTMLDivElement | null>;
  zoomAtPoint: (screenPoint: Point, zoom: number) => void;
};

export function useCanvasPointerInteractions({
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
}: UseCanvasPointerInteractionsOptions) {
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [pointerModifiers, setPointerModifiers] = useState({
    alt: false,
    mod: false,
    primaryDown: false,
    shift: false,
  });
  const panLastScreenPointRef = useRef<Point | null>(null);
  const lastTileClickRef = useRef<TileClickRecord | null>(null);

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

  function screenPointToWorld(screenPoint: Point) {
    return screenToWorld(screenPoint, getLiveCamera());
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

  const selectionRect = getSelectionRect(dragMode);
  const movingTileIds =
    dragMode?.type === "moveTiles" ? dragMode.tileIds : new Set<string>();

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

    const isAdditive = event.ctrlKey || event.metaKey;

    if (!isAdditive) {
      setSelectedTileIds(new Set());
    }

    setDragMode({
      type: "selectBox",
      pointerId: event.pointerId,
      baseSelection: isAdditive
        ? new Set(selectedTileIdsRef.current)
        : new Set(),
      isAdditive,
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

    if (dragMode.type === "selectBox") {
      setSelectedTileIds(
        resolveMarqueeSelection({
          baseSelection: dragMode.baseSelection,
          isAdditive: dragMode.isAdditive,
          tiles,
          startWorldPoint: dragMode.startWorldPoint,
          endWorldPoint: worldPoint,
        }),
      );
      setDragMode({
        ...dragMode,
        currentWorldPoint: worldPoint,
      });
    }
  }

  function endActiveDrag(endedDragMode: DragMode, outcome: "commit" | "cancel") {
    if (endedDragMode.type === "pan") {
      syncCamera();
      panLastScreenPointRef.current = null;
      return;
    }

    if (endedDragMode.type === "selectBox") {
      if (outcome === "commit") {
        setSelectedTileIds(
          resolveMarqueeSelection({
            baseSelection: endedDragMode.baseSelection,
            isAdditive: endedDragMode.isAdditive,
            tiles,
            startWorldPoint: endedDragMode.startWorldPoint,
            endWorldPoint: endedDragMode.currentWorldPoint,
          }),
        );
      } else {
        setSelectedTileIds(
          endedDragMode.isAdditive
            ? new Set(endedDragMode.baseSelection)
            : new Set(),
        );
      }
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

  function handlePointerCancel() {
    setPointerModifiers((currentModifiers) => ({
      ...currentModifiers,
      primaryDown: false,
    }));

    if (dragMode) {
      endActiveDrag(dragMode, "cancel");
    }

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

    viewportRef.current?.focus({ preventScroll: true });
    viewportRef.current?.setPointerCapture(event.pointerId);

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
      selectedTileIds: selectedTileIdsRef.current ?? new Set(),
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
    window.open(tile.video.url, "_blank", "noreferrer");
    void source;
    setDragMode(null);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const rect = viewportRef.current?.getBoundingClientRect();
    const zoomDirection = event.deltaY > 0 ? -1 : 1;

    zoomAtPoint(
      {
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
      },
      getLiveCamera().zoom + zoomDirection * 0.12,
    );
    syncCamera();
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
      selectedTileIds: selectedTileIdsRef.current ?? new Set(),
      tileId: tile.id,
    });

    setSelectedTileIds(nextSelectedTileIds);
    openContextMenu(event.clientX, event.clientY, [...nextSelectedTileIds]);
  }

  return {
    activeCanvasInteraction,
    dragMode,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTileContextMenu,
    handleTileDoubleClick,
    handleTilePointerDown,
    handleViewportContextMenu,
    handleWheel,
    movingTileIds,
    pointerModifiers,
    selectionRect,
    setPointerModifiers,
  };
}
