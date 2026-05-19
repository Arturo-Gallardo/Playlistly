"use client";

import { useCallback, useState } from "react";

type Camera = {
  x: number;
  y: number;
  zoom: number;
};

type Point = {
  x: number;
  y: number;
};

const minZoom = 0.35;
const maxZoom = 2.4;

// this is the starting camera position inside the larger canvas
const startCamera: Camera = {
  x: 80,
  y: 110,
  zoom: 1,
};

function clampZoom(zoom: number) {
  // keep the canvas from getting too tiny or too huge
  return Math.min(maxZoom, Math.max(minZoom, zoom));
}

export function useCanvasCamera() {
  const [camera, setCamera] = useState<Camera>(startCamera);

  const panBy = useCallback((delta: Point) => {
    // panning only moves the camera, not the video tiles
    setCamera((currentCamera) => ({
      ...currentCamera,
      x: currentCamera.x + delta.x,
      y: currentCamera.y + delta.y,
    }));
  }, []);

  const resetCamera = useCallback(() => {
    setCamera(startCamera);
  }, []);

  const zoomAtPoint = useCallback((point: Point, nextZoom: number) => {
    setCamera((currentCamera) => {
      const zoom = clampZoom(nextZoom);
      const zoomChange = zoom / currentCamera.zoom;

      // keep the point under the cursor steady while zooming
      return {
        zoom,
        x: point.x - (point.x - currentCamera.x) * zoomChange,
        y: point.y - (point.y - currentCamera.y) * zoomChange,
      };
    });
  }, []);

  const zoomBy = useCallback(
    (amount: number, point?: Point) => {
      // button zooms use the middle of the screen unless a point is passed in
      const zoomPoint = point ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };

      zoomAtPoint(zoomPoint, camera.zoom + amount);
    },
    [camera.zoom, zoomAtPoint],
  );

  return {
    camera,
    panBy,
    resetCamera,
    zoomBy,
    zoomAtPoint,
  };
}
