"use client";

import type { MouseEvent, PointerEvent, RefObject, WheelEvent } from "react";
import type { CanvasTile, Rect, VisibleCanvasTile } from "../../../lib/canvas/canvas-layout";
import type { HoveredVideoDetails } from "../VideoGrid";
import { SelectionBox } from "../SelectionBox";
import { VideoGrid } from "../VideoGrid";

type CanvasViewportProps = {
  bounds: Rect;
  cameraZoom: number;
  dragModeType: string | undefined;
  isTileEnterActive: boolean;
  movingTileIds: Set<string>;
  onPointerCancel: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onTileContextMenu: (event: MouseEvent<HTMLDivElement>, tile: CanvasTile) => void;
  onTileDoubleClick: (
    tile: CanvasTile,
    source: "pointer-detail" | "react-double-click",
  ) => void;
  onTilePointerDown: (
    event: PointerEvent<HTMLDivElement>,
    tile: CanvasTile,
  ) => void;
  onVideoHover: (details: HoveredVideoDetails) => void;
  onVideoHoverEnd: () => void;
  onViewportContextMenu: (event: MouseEvent<HTMLDivElement>) => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  selectionRect: Rect | null;
  selectedTileIds: Set<string>;
  viewportRef: RefObject<HTMLDivElement | null>;
  visibleTiles: VisibleCanvasTile[];
  worldLayerRef: RefObject<HTMLDivElement | null>;
};

export function CanvasViewport({
  bounds,
  cameraZoom,
  dragModeType,
  isTileEnterActive,
  movingTileIds,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onTileContextMenu,
  onTileDoubleClick,
  onTilePointerDown,
  onVideoHover,
  onVideoHoverEnd,
  onViewportContextMenu,
  onWheel,
  selectionRect,
  selectedTileIds,
  viewportRef,
  visibleTiles,
  worldLayerRef,
}: CanvasViewportProps) {
  return (
    <div
      className={`absolute inset-0 z-0 touch-none select-none bg-[radial-gradient(circle,_rgba(255,255,255,0.16)_1px,_transparent_1px)] [background-size:20px_20px] ${
        dragModeType === "pan" ? "cursor-grabbing" : "cursor-crosshair"
      }`}
      onContextMenu={onViewportContextMenu}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      ref={viewportRef}
      tabIndex={-1}
    >
      <div className="origin-top-left will-change-transform" ref={worldLayerRef}>
        <VideoGrid
          bounds={bounds}
          cameraZoom={cameraZoom}
          isTileEnterActive={isTileEnterActive}
          movingTileIds={movingTileIds}
          onTileContextMenu={onTileContextMenu}
          onTileDoubleClick={onTileDoubleClick}
          onTilePointerDown={onTilePointerDown}
          onVideoHover={onVideoHover}
          onVideoHoverEnd={onVideoHoverEnd}
          selectedTileIds={selectedTileIds}
          visibleTiles={visibleTiles}
        />
        {selectionRect ? <SelectionBox rect={selectionRect} /> : null}
      </div>
    </div>
  );
}
