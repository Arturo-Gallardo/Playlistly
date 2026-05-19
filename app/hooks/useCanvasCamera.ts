"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Point, Rect } from "../lib/canvas-layout";

type Camera = {
  x: number;
  y: number;
  zoom: number;
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

function getCameraTransform(camera: Camera) {
  return `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`;
}

export function useCanvasCamera() {
  const [camera, setCamera] = useState<Camera>(startCamera);
  const cameraRef = useRef(camera);
  const worldLayerRef = useRef<HTMLDivElement | null>(null);

  const applyCameraToWorld = useCallback((nextCamera: Camera) => {
    const worldLayer = worldLayerRef.current;

    if (worldLayer) {
      worldLayer.style.transform = getCameraTransform(nextCamera);
    }
  }, []);

  const commitCamera = useCallback(
    (nextCamera: Camera) => {
      cameraRef.current = nextCamera;
      setCamera(nextCamera);
      applyCameraToWorld(nextCamera);
    },
    [applyCameraToWorld],
  );

  useEffect(() => {
    cameraRef.current = camera;
    applyCameraToWorld(camera);
  }, [applyCameraToWorld, camera]);

  // panning updates the dom immediately so the canvas tracks the pointer
  const panBy = useCallback(
    (delta: Point) => {
      const nextCamera = {
        ...cameraRef.current,
        x: cameraRef.current.x + delta.x,
        y: cameraRef.current.y + delta.y,
      };

      cameraRef.current = nextCamera;
      applyCameraToWorld(nextCamera);
    },
    [applyCameraToWorld],
  );

  const syncCamera = useCallback(() => {
    setCamera({ ...cameraRef.current });
  }, []);

  const centerCameraOnRect = useCallback(
    (rect: Rect, viewportSize: { width: number; height: number }) => {
      commitCamera({
        ...cameraRef.current,
        x:
          viewportSize.width / 2 -
          (rect.x + rect.width / 2) * cameraRef.current.zoom,
        y:
          viewportSize.height / 2 -
          (rect.y + rect.height / 2) * cameraRef.current.zoom,
      });
    },
    [commitCamera],
  );

  const resetCamera = useCallback(() => {
    commitCamera(startCamera);
  }, [commitCamera]);

  const zoomAtPoint = useCallback(
    (point: Point, nextZoom: number) => {
      const currentCamera = cameraRef.current;
      const zoom = clampZoom(nextZoom);
      const zoomChange = zoom / currentCamera.zoom;

      commitCamera({
        zoom,
        x: point.x - (point.x - currentCamera.x) * zoomChange,
        y: point.y - (point.y - currentCamera.y) * zoomChange,
      });
    },
    [commitCamera],
  );

  const getLiveCamera = useCallback(() => cameraRef.current, []);

  return {
    camera,
    centerCameraOnRect,
    getLiveCamera,
    panBy,
    resetCamera,
    restoreCamera: commitCamera,
    syncCamera,
    worldLayerRef,
    zoomAtPoint,
  };
}
