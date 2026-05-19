import type { MouseEvent, PointerEvent } from "react";
import type {
  CanvasTile,
  Rect,
  VisibleCanvasTile,
} from "../lib/canvas-layout";
import type { PlaylistVideo } from "../types/playlist";
import { VideoCard, type ThumbnailSize } from "./VideoCard";

export type HoveredVideoDetails = {
  index: number;
  video: PlaylistVideo;
};

type VideoGridProps = {
  bounds: Rect;
  cameraZoom: number;
  movingTileIds: Set<string>;
  onTileDoubleClick: (
    tile: CanvasTile,
    source: "react-double-click",
  ) => void;
  onVideoHover: (details: HoveredVideoDetails) => void;
  onVideoHoverEnd: () => void;
  onTileContextMenu: (
    event: MouseEvent<HTMLDivElement>,
    tile: CanvasTile,
  ) => void;
  onTilePointerDown: (
    event: PointerEvent<HTMLDivElement>,
    tile: CanvasTile,
  ) => void;
  selectedTileIds: Set<string>;
  visibleTiles: VisibleCanvasTile[];
};

export function VideoGrid({
  bounds,
  cameraZoom,
  movingTileIds,
  onTileDoubleClick,
  onVideoHover,
  onVideoHoverEnd,
  onTileContextMenu,
  onTilePointerDown,
  selectedTileIds,
  visibleTiles,
}: VideoGridProps) {
  const thumbnailSize = getThumbnailSizeForZoom(cameraZoom);

  return (
    <section
      className="relative"
      style={{
        height: Math.max(1, bounds.y + bounds.height),
        width: Math.max(1, bounds.x + bounds.width),
      }}
    >
      {visibleTiles.map((tile) => (
        <div
          className="absolute"
          key={tile.id}
          style={{
            height: tile.height,
            left: tile.x,
            top: tile.y,
            width: tile.width,
          }}
        >
          <VideoCard
            index={tile.index}
            isMoving={movingTileIds.has(tile.id)}
            isSelected={selectedTileIds.has(tile.id)}
            onContextMenu={(event) => onTileContextMenu(event, tile)}
            onDoubleClick={() => onTileDoubleClick(tile, "react-double-click")}
            onHover={(video) => onVideoHover({ index: tile.index, video })}
            onHoverEnd={onVideoHoverEnd}
            onPointerDown={(event) => onTilePointerDown(event, tile)}
            thumbnailSize={thumbnailSize}
            video={tile.video}
          />
        </div>
      ))}
    </section>
  );
}

function getThumbnailSizeForZoom(zoom: number): ThumbnailSize {
  if (zoom < 0.4) {
    return "16px";
  }

  if (zoom < 0.5) {
    return "32px";
  }

  if (zoom < 0.8) {
    return "64px";
  }

  return "132px";
}
