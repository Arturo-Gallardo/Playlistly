"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampCameraZoom,
  fitCameraToRect as buildFitCamera,
  focusCameraOnRect as buildFocusCamera,
  type CameraState,
} from "../../lib/canvas/camera-fit";
import type { Point, Rect, ViewportSize } from "../../lib/canvas/canvas-layout";

// this is the starting camera position inside the larger canvas
const startCamera: CameraState = {
  x: 80,
  y: 110,
  zoom: 1,
};

function getCameraTransform(camera: CameraState) {
  return `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`;
}

export function useCanvasCamera() {
  const [camera, setCamera] = useState<CameraState>(startCamera);
  const cameraRef = useRef(camera);
  const worldLayerRef = useRef<HTMLDivElement | null>(null);

  const applyCameraToWorld = useCallback((nextCamera: CameraState) => {
    const worldLayer = worldLayerRef.current;

    if (worldLayer) {
      worldLayer.style.transform = getCameraTransform(nextCamera);
    }
  }, []);

  const commitCamera = useCallback(
    (nextCamera: CameraState) => {
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

  const fitCameraToRect = useCallback(
    (rect: Rect, viewportSize: ViewportSize) => {
      commitCamera(buildFitCamera(rect, viewportSize));
    },
    [commitCamera],
  );

  const focusCameraOnRect = useCallback(
    (rect: Rect, viewportSize: ViewportSize) => {
      commitCamera(buildFocusCamera(rect, viewportSize));
    },
    [commitCamera],
  );

  const resetCamera = useCallback(() => {
    commitCamera(startCamera);
  }, [commitCamera]);

  const zoomAtPoint = useCallback(
    (point: Point, nextZoom: number) => {
      const currentCamera = cameraRef.current;
      const zoom = clampCameraZoom(nextZoom);
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
    fitCameraToRect,
    focusCameraOnRect,
    getLiveCamera,
    panBy,
    resetCamera,
    restoreCamera: commitCamera,
    syncCamera,
    worldLayerRef,
    zoomAtPoint,
  };
}
