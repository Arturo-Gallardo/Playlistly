"use client";

import Image from "next/image";
import type { PointerEvent, WheelEvent } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCanvasCamera } from "../hooks/useCanvasCamera";
import { useCanvasTiles } from "../hooks/useCanvasTiles";
import { usePlaylistVideos } from "../hooks/usePlaylistVideos";
import {
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
import type { PlaylistVideo } from "../types/playlist";
import { AppToolbar } from "./AppToolbar";
import { SelectionBox } from "./SelectionBox";
import { type HoveredVideoDetails, VideoGrid } from "./VideoGrid";

const tileDragThreshold = 4;

type AppCanvasProps = {
  videos: PlaylistVideo[];
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
      grabOffsets: Map<string, Point>;
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

export function AppCanvas({ videos }: AppCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const didCenterInitialTilesRef = useRef(false);
  const centeredPlaylistRequestRef = useRef(0);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [centerPlaylistRequest, setCenterPlaylistRequest] = useState(0);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [areVideoDetailsHidden, setAreVideoDetailsHidden] = useState(false);
  const [hoveredVideoDetails, setHoveredVideoDetails] =
    useState<HoveredVideoDetails | null>(null);
  const [isSlowPlaylistLoad, setIsSlowPlaylistLoad] = useState(false);
  const [loadNotification, setLoadNotification] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize | null>(null);
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(
    () => new Set(),
  );
  const panLastScreenPointRef = useRef<Point | null>(null);
  const {
    camera,
    centerCameraOnRect,
    getLiveCamera,
    panBy,
    syncCamera,
    worldLayerRef,
    zoomAtPoint,
  } = useCanvasCamera();
  const {
    errorMessage,
    loadPlaylist,
    status: playlistStatus,
    videos: playlistVideos,
  } = usePlaylistVideos(videos);
  const { bounds, columnCount, movedTileIds, placeTilesAtWorldPoint, tiles } =
    useCanvasTiles(playlistVideos);

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

    return getVisibleCanvasTiles({
      tiles,
      columnCount,
      cameraZoom: camera.zoom,
      movedTileIds,
      visibleRect: getVisibleWorldRect({
        camera,
        viewportSize,
      }),
    });
  }, [camera, columnCount, movedTileIds, tiles, viewportSize]);

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

    centerCameraOnRect(bounds, viewportSize);
    didCenterInitialTilesRef.current = true;
    centeredPlaylistRequestRef.current = centerPlaylistRequest;
  }, [bounds, centerCameraOnRect, centerPlaylistRequest, viewportSize]);

  useEffect(() => {
    return () => {
      // clear the toast timer if the canvas unmounts mid-animation
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
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

  async function handlePlaylistLoad(playlist: string) {
    setIsSlowPlaylistLoad(false);
    const didLoad = await loadPlaylist(playlist);

    if (!didLoad) {
      return;
    }

    setSelectedTileIds(new Set());
    setCenterPlaylistRequest((currentRequest) => currentRequest + 1);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setLoadNotification("playlist loaded");
    // keep the message around just long enough for the css animation
    notificationTimeoutRef.current = setTimeout(() => {
      setLoadNotification(null);
    }, 1800);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isInteractiveElement(event.target)) {
      return;
    }

    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    const screenPoint = getViewportPoint(event, viewportRef.current);
    const worldPoint = screenPointToWorld(screenPoint);

    // keep receiving pointer moves even if the cursor moves fast
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
        worldPoint,
        dragMode.grabOffsets,
      );
      return;
    }

    if (dragMode.type === "pendingTile") {
      const movedDistance = getDistance(dragMode.startScreenPoint, screenPoint);

      if (movedDistance < tileDragThreshold) {
        return;
      }

      placeTilesAtWorldPoint(
        dragMode.tileIds,
        worldPoint,
        dragMode.grabOffsets,
      );
      setDragMode({
        type: "moveTiles",
        pointerId: dragMode.pointerId,
        tileIds: dragMode.tileIds,
        grabOffsets: dragMode.grabOffsets,
      });
      return;
    }

    setDragMode({
      ...dragMode,
      currentWorldPoint: worldPoint,
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragMode || dragMode.pointerId !== event.pointerId) {
      return;
    }

    if (dragMode.type === "pan") {
      syncCamera();
      panLastScreenPointRef.current = null;
    }

    if (dragMode.type === "selectBox") {
      const rect = normalizeRect(
        dragMode.startWorldPoint,
        dragMode.currentWorldPoint,
      );
      const selectedIds = getTilesInsideRect(tiles, rect);
      setSelectedTileIds(selectedIds);
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

    event.stopPropagation();

    if (event.detail >= 2) {
      handleTileDoubleClick(tile, "pointer-detail");
      return;
    }

    const nextSelectedTileIds = getNextSelectedTileIds({
      isAdditive: event.shiftKey || event.ctrlKey || event.metaKey,
      selectedTileIds,
      tileId: tile.id,
    });
    const startScreenPoint = getViewportPoint(event, viewportRef.current);
    const grabOffsets = buildGrabOffsets(
      nextSelectedTileIds,
      tiles,
      screenPointToWorld(startScreenPoint),
    );

    viewportRef.current?.setPointerCapture(event.pointerId);

    setSelectedTileIds(nextSelectedTileIds);
    setDragMode({
      type: "pendingTile",
      pointerId: event.pointerId,
      tileIds: nextSelectedTileIds,
      startScreenPoint,
      grabOffsets,
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
      camera.zoom + zoomDirection * 0.12,
    );
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#111111] text-white">
      <AppToolbar
        areVideoDetailsHidden={areVideoDetailsHidden}
        errorMessage={errorMessage}
        onPlaylistLoad={handlePlaylistLoad}
        onVideoDetailsToggle={() =>
          setAreVideoDetailsHidden((currentValue) => !currentValue)
        }
        playlistStatus={playlistStatus}
      />

      <div
        className={`absolute inset-0 touch-none select-none bg-[radial-gradient(circle,_rgba(255,255,255,0.16)_1px,_transparent_1px)] [background-size:20px_20px] ${
          dragMode?.type === "pan" ? "cursor-grabbing" : "cursor-crosshair"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          if (dragMode?.type === "pan") {
            syncCamera();
            panLastScreenPointRef.current = null;
          }

          setDragMode(null);
        }}
        onWheel={handleWheel}
        ref={viewportRef}
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

      {loadNotification ? (
        <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
          <div className="playlist-loaded-toast rounded-full border border-[#CA3E47]/50 bg-[#111111]/65 px-5 py-3 shadow-2xl backdrop-blur-md">
            <p className="font-control text-xs font-semibold uppercase tracking-[0.28em] text-white">
              {loadNotification}
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
  const rect = viewportElement?.getBoundingClientRect();

  return {
    x: event.clientX - (rect?.left ?? 0),
    y: event.clientY - (rect?.top ?? 0),
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
