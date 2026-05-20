import {
  applyTileSnap,
  normalizeRect,
  type CanvasTile,
  type Point,
  type Rect,
} from "./canvas-layout";
import type { DragMode } from "../../types/canvas-interaction";

export const tileDragThreshold = 4;
export const tileDoubleClickWindowMs = 400;

export function isInteractiveElement(target: EventTarget) {
  return (
    target instanceof Element && Boolean(target.closest("a, button, input"))
  );
}

export function isEditableTarget(target: EventTarget) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest("input, textarea, select, [contenteditable='true']") !==
        null)
  );
}

export function shouldPanCanvas(event: {
  altKey: boolean;
  button: number;
}) {
  return event.altKey || event.button === 1;
}

export function getSelectionRect(dragMode: DragMode | null): Rect | null {
  if (dragMode?.type !== "selectBox") {
    return null;
  }

  return normalizeRect(dragMode.startWorldPoint, dragMode.currentWorldPoint);
}

export function isTileDoubleClick(
  tileId: string,
  screenPoint: Point,
  lastClick: { screenPoint: Point; tileId: string; time: number } | null,
) {
  if (!lastClick || lastClick.tileId !== tileId) {
    return false;
  }

  const elapsedMs = Date.now() - lastClick.time;

  return (
    elapsedMs <= tileDoubleClickWindowMs &&
    Math.hypot(
      lastClick.screenPoint.x - screenPoint.x,
      lastClick.screenPoint.y - screenPoint.y,
    ) <= tileDragThreshold
  );
}

export function getTilePlacementPoint(
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
