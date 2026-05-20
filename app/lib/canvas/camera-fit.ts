import type { Point, Rect, ViewportSize } from "./canvas-layout";

export const cameraZoomLimits = {
  min: 0.5,
  max: 2.4,
} as const;

export const cameraZoomStep = 0.12;

/** Viewport padding when fitting the full tile bounds. */
export const cameraFitPaddingPx = 56;

/** Zoom used when jumping to a single tile so it stays readable on large canvases. */
export const cameraFocusZoom = 1.15;

export type CameraState = {
  x: number;
  y: number;
  zoom: number;
};

export function clampCameraZoom(zoom: number) {
  return Math.min(cameraZoomLimits.max, Math.max(cameraZoomLimits.min, zoom));
}

export function getViewportCenterPoint(viewportSize: ViewportSize): Point {
  return {
    x: viewportSize.width / 2,
    y: viewportSize.height / 2,
  };
}

/** Pan and zoom so the given world rect fits inside the viewport. */
export function fitCameraToRect(
  rect: Rect,
  viewportSize: ViewportSize,
): CameraState {
  const padding = cameraFitPaddingPx;
  const contentWidth = Math.max(rect.width, 1);
  const contentHeight = Math.max(rect.height, 1);
  const availableWidth = Math.max(viewportSize.width - padding * 2, 1);
  const availableHeight = Math.max(viewportSize.height - padding * 2, 1);

  const zoom = clampCameraZoom(
    Math.min(availableWidth / contentWidth, availableHeight / contentHeight),
  );

  return {
    zoom,
    x:
      viewportSize.width / 2 -
      (rect.x + rect.width / 2) * zoom,
    y:
      viewportSize.height / 2 -
      (rect.y + rect.height / 2) * zoom,
  };
}

/** Center the camera on one tile without over-zooming tiny cards. */
export function focusCameraOnRect(
  rect: Rect,
  viewportSize: ViewportSize,
): CameraState {
  const fittedZoom = fitCameraToRect(rect, viewportSize).zoom;
  const zoom = clampCameraZoom(
    Math.min(Math.max(fittedZoom, cameraFocusZoom), cameraZoomLimits.max),
  );

  return {
    zoom,
    x:
      viewportSize.width / 2 -
      (rect.x + rect.width / 2) * zoom,
    y:
      viewportSize.height / 2 -
      (rect.y + rect.height / 2) * zoom,
  };
}
