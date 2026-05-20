import type { Point, ViewportSize } from "./canvas-layout";

export function getViewportPointFromClient(
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

export function getViewportPoint(
  event: { clientX: number; clientY: number },
  viewportElement: HTMLElement | null,
): Point {
  return getViewportPointFromClient(
    event.clientX,
    event.clientY,
    viewportElement,
  );
}

export function getViewportSize(
  viewportElement: HTMLElement | null,
): ViewportSize | null {
  const rect = viewportElement?.getBoundingClientRect();

  if (!rect) {
    return null;
  }

  return {
    height: rect.height,
    width: rect.width,
  };
}

export function getDistance(firstPoint: Point, secondPoint: Point) {
  return Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y);
}
