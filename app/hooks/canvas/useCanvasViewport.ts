"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  getVisibleCanvasTiles,
  getVisibleWorldRect,
  type CanvasTile,
  type Rect,
  type ViewportSize,
} from "../../lib/canvas/canvas-layout";
import { getViewportSize } from "../../lib/canvas/canvas-viewport";

type UseCanvasViewportOptions = {
  bounds: Rect;
  fitCameraToRect: (rect: Rect, viewportSize: ViewportSize) => void;
  getLiveCamera: () => { x: number; y: number; zoom: number };
  movedTileIds: Set<string>;
  tiles: CanvasTile[];
};

export function useCanvasViewport({
  bounds,
  fitCameraToRect,
  getLiveCamera,
  movedTileIds,
  tiles,
}: UseCanvasViewportOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const didCenterInitialTilesRef = useRef(false);
  const centeredPlaylistRequestRef = useRef(0);
  const pendingCenterRectRef = useRef<Rect | null>(null);
  const [centerPlaylistRequest, setCenterPlaylistRequest] = useState(0);
  const [viewportSize, setViewportSize] = useState<ViewportSize | null>(null);

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
  }, [getLiveCamera, movedTileIds, tiles, viewportSize]);

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
    fitCameraToRect(rectToCenter, viewportSize);
    pendingCenterRectRef.current = null;
    didCenterInitialTilesRef.current = true;
    centeredPlaylistRequestRef.current = centerPlaylistRequest;
  }, [
    bounds,
    fitCameraToRect,
    centerPlaylistRequest,
    tiles.length,
    viewportSize,
  ]);

  return {
    didCenterInitialTilesRef,
    pendingCenterRectRef,
    setCenterPlaylistRequest,
    viewportRef,
    viewportSize,
    visibleTiles,
  };
}
