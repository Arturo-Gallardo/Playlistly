import type { PlaylistVideo } from "../types/playlist";

export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

export type CanvasTile = Rect & {
  id: string;
  video: PlaylistVideo;
};

export type VisibleCanvasTile = CanvasTile & {
  index: number;
};

export const canvasTileConfig = {
  width: 128,
  height: 72,
  gap: 8,
};

export const tileSnapThreshold = 12;

const viewportTileBuffer = 360;

export function getCanvasCellStride() {
  return {
    width: canvasTileConfig.width + canvasTileConfig.gap,
    height: canvasTileConfig.height + canvasTileConfig.gap,
  };
}

export function createBatchTileId(batchId: string, videoId: string) {
  return `${batchId}:${videoId}`;
}

export function resolvePastedTileId(
  occupiedTileIds: ReadonlySet<string>,
  batchId: string,
  videoId: string,
  entryIndex: number,
) {
  const primaryId = createBatchTileId(batchId, videoId);

  if (!occupiedTileIds.has(primaryId)) {
    return primaryId;
  }

  const indexedId = createBatchTileId(batchId, `${videoId}~${entryIndex}`);

  if (!occupiedTileIds.has(indexedId)) {
    return indexedId;
  }

  let suffix = 2;

  while (suffix < 1000) {
    const candidate = createBatchTileId(
      batchId,
      `${videoId}~${entryIndex}~${suffix}`,
    );

    if (!occupiedTileIds.has(candidate)) {
      return candidate;
    }

    suffix += 1;
  }

  return createBatchTileId(batchId, `${videoId}~${crypto.randomUUID()}`);
}

export function createCanvasTilesWithIds(
  videos: PlaylistVideo[],
  getTileId: (video: PlaylistVideo) => string,
  origin: Point,
) {
  const columnCount = getBalancedColumnCount(videos.length);
  const cellStride = getCanvasCellStride();

  return videos.map((video, index) => {
    const column = index % columnCount;
    const row = Math.floor(index / columnCount);

    return {
      id: getTileId(video),
      video,
      x: origin.x + column * cellStride.width,
      y: origin.y + row * cellStride.height,
      width: canvasTileConfig.width,
      height: canvasTileConfig.height,
    } satisfies CanvasTile;
  });
}

export function getAppendOrigin(existingBounds: Rect, newBatchBounds: Rect): Point {
  const hasExistingTiles =
    existingBounds.width > 1 || existingBounds.height > 1;

  if (!hasExistingTiles) {
    return { x: 0, y: 0 };
  }

  const batchGap = canvasTileConfig.gap * 4;

  return {
    x: existingBounds.x + existingBounds.width + batchGap,
    y: existingBounds.y,
  };
}

export function getGridCanvasBounds(tileCount: number): Rect {
  if (tileCount === 0) {
    return {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    };
  }

  const columnCount = getBalancedColumnCount(tileCount);
  const rowCount = Math.ceil(tileCount / columnCount);
  const cellStride = getCanvasCellStride();

  return {
    x: 0,
    y: 0,
    width: columnCount * cellStride.width - canvasTileConfig.gap,
    height: rowCount * cellStride.height - canvasTileConfig.gap,
  };
}

export function expandRectBounds(bounds: Rect, rect: Rect): Rect {
  const minX = Math.min(bounds.x, rect.x);
  const minY = Math.min(bounds.y, rect.y);
  const maxX = Math.max(bounds.x + bounds.width, rect.x + rect.width);
  const maxY = Math.max(bounds.y + bounds.height, rect.y + rect.height);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getRectBounds(rects: Rect[]): Rect {
  if (rects.length === 0) {
    return {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    };
  }

  let minX = rects[0].x;
  let minY = rects[0].y;
  let maxX = rects[0].x + rects[0].width;
  let maxY = rects[0].y + rects[0].height;

  for (let index = 1; index < rects.length; index += 1) {
    const rect = rects[index];
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getVisibleWorldRect({
  camera,
  viewportSize,
}: {
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  viewportSize: ViewportSize;
}): Rect {
  // extra world padding when zoomed out so tiles do not pop in/out while panning
  const zoomBufferMultiplier =
    camera.zoom < 0.45 ? 4 : camera.zoom < 0.65 ? 2.5 : camera.zoom < 0.85 ? 1.5 : 1;
  const buffer = (viewportTileBuffer * zoomBufferMultiplier) / camera.zoom;
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera);
  const bottomRight = screenToWorld(
    {
      x: viewportSize.width,
      y: viewportSize.height,
    },
    camera,
  );

  return {
    x: topLeft.x - buffer,
    y: topLeft.y - buffer,
    width: bottomRight.x - topLeft.x + buffer * 2,
    height: bottomRight.y - topLeft.y + buffer * 2,
  };
}

export function getVisibleCanvasTiles({
  tiles,
  visibleRect,
  cameraZoom = 1,
  movedTileIds = new Set<string>(),
}: {
  tiles: CanvasTile[];
  visibleRect: Rect;
  cameraZoom?: number;
  movedTileIds?: ReadonlySet<string>;
}) {
  const visibleTiles: VisibleCanvasTile[] = [];
  const cellStride = getCanvasCellStride();
  const gridPadding =
    cameraZoom < 0.45 ? 4 : cameraZoom < 0.65 ? 3 : cameraZoom < 0.85 ? 2 : 1;
  const columnStart = Math.max(
    0,
    Math.floor(visibleRect.x / cellStride.width) - gridPadding,
  );
  const columnEnd =
    Math.ceil((visibleRect.x + visibleRect.width) / cellStride.width) +
    gridPadding;
  const rowStart = Math.max(
    0,
    Math.floor(visibleRect.y / cellStride.height) - gridPadding,
  );
  const rowEnd =
    Math.ceil((visibleRect.y + visibleRect.height) / cellStride.height) +
    gridPadding;

  for (let index = 0; index < tiles.length; index += 1) {
    const tile = tiles[index];
    const column = Math.floor(tile.x / cellStride.width);
    const row = Math.floor(tile.y / cellStride.height);
    const isInGridWindow =
      column >= columnStart &&
      column <= columnEnd &&
      row >= rowStart &&
      row <= rowEnd;

    if (!isInGridWindow && !movedTileIds.has(tile.id)) {
      continue;
    }

    if (rectsIntersect(tile, visibleRect)) {
      visibleTiles.push({
        ...tile,
        index,
      });
    }
  }

  return visibleTiles;
}

type SnapCandidate = {
  delta: number;
  distance: number;
  priority: number;
};

export function getProposedTilesBoundingRect(
  tiles: CanvasTile[],
  tileIds: Set<string>,
  worldPoint: Point,
  grabOffsets: Map<string, Point>,
): Rect {
  const proposedRects: Rect[] = [];

  for (const tile of tiles) {
    if (!tileIds.has(tile.id)) {
      continue;
    }

    const grabOffset = grabOffsets.get(tile.id);

    if (!grabOffset) {
      continue;
    }

    proposedRects.push({
      x: worldPoint.x - grabOffset.x,
      y: worldPoint.y - grabOffset.y,
      width: tile.width,
      height: tile.height,
    });
  }

  return getRectBounds(proposedRects);
}

export function getSnapDelta({
  movingBounds,
  staticTiles,
  gap = canvasTileConfig.gap,
  threshold = tileSnapThreshold,
}: {
  movingBounds: Rect;
  staticTiles: Rect[];
  gap?: number;
  threshold?: number;
}): Point {
  const movingLeft = movingBounds.x;
  const movingRight = movingBounds.x + movingBounds.width;
  const movingTop = movingBounds.y;
  const movingBottom = movingBounds.y + movingBounds.height;
  const horizontalCandidates: SnapCandidate[] = [];
  const verticalCandidates: SnapCandidate[] = [];

  for (const staticTile of staticTiles) {
    const staticLeft = staticTile.x;
    const staticRight = staticTile.x + staticTile.width;
    const staticTop = staticTile.y;
    const staticBottom = staticTile.y + staticTile.height;

    horizontalCandidates.push(
      {
        delta: staticRight + gap - movingLeft,
        distance: Math.abs(staticRight + gap - movingLeft),
        priority: 0,
      },
      {
        delta: staticLeft - gap - movingRight,
        distance: Math.abs(staticLeft - gap - movingRight),
        priority: 0,
      },
      {
        delta: staticLeft - movingLeft,
        distance: Math.abs(staticLeft - movingLeft),
        priority: 1,
      },
      {
        delta: staticRight - movingRight,
        distance: Math.abs(staticRight - movingRight),
        priority: 1,
      },
    );

    verticalCandidates.push(
      {
        delta: staticBottom + gap - movingTop,
        distance: Math.abs(staticBottom + gap - movingTop),
        priority: 0,
      },
      {
        delta: staticTop - gap - movingBottom,
        distance: Math.abs(staticTop - gap - movingBottom),
        priority: 0,
      },
      {
        delta: staticTop - movingTop,
        distance: Math.abs(staticTop - movingTop),
        priority: 1,
      },
      {
        delta: staticBottom - movingBottom,
        distance: Math.abs(staticBottom - movingBottom),
        priority: 1,
      },
    );
  }

  return {
    x: pickBestSnapDelta(horizontalCandidates, threshold),
    y: pickBestSnapDelta(verticalCandidates, threshold),
  };
}

export function applyTileSnap(
  worldPoint: Point,
  tileIds: Set<string>,
  grabOffsets: Map<string, Point>,
  tiles: CanvasTile[],
): Point {
  const movingBounds = getProposedTilesBoundingRect(
    tiles,
    tileIds,
    worldPoint,
    grabOffsets,
  );
  const staticTiles = tiles.filter((tile) => !tileIds.has(tile.id));
  const snapDelta = getSnapDelta({
    movingBounds,
    staticTiles,
  });

  return {
    x: worldPoint.x + snapDelta.x,
    y: worldPoint.y + snapDelta.y,
  };
}

function pickBestSnapDelta(candidates: SnapCandidate[], threshold: number) {
  let bestCandidate: SnapCandidate | null = null;

  for (const candidate of candidates) {
    if (candidate.distance > threshold) {
      continue;
    }

    if (
      !bestCandidate ||
      candidate.distance < bestCandidate.distance ||
      (candidate.distance === bestCandidate.distance &&
        candidate.priority < bestCandidate.priority)
    ) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate?.delta ?? 0;
}

export function buildGrabOffsets(
  tileIds: Set<string>,
  tiles: CanvasTile[],
  worldPoint: Point,
) {
  const grabOffsets = new Map<string, Point>();

  for (const tile of tiles) {
    if (!tileIds.has(tile.id)) {
      continue;
    }

    grabOffsets.set(tile.id, {
      x: worldPoint.x - tile.x,
      y: worldPoint.y - tile.y,
    });
  }

  return grabOffsets;
}

export function getBalancedColumnCount(videoCount: number) {
  // balance the number of tiles per side so playlists do not stack vertically
  return Math.max(1, Math.ceil(Math.sqrt(videoCount)));
}

export function normalizeRect(start: Point, current: Point): Rect {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);

  return {
    x,
    y,
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  };
}

export function rectsIntersect(firstRect: Rect, secondRect: Rect) {
  return (
    firstRect.x < secondRect.x + secondRect.width &&
    firstRect.x + firstRect.width > secondRect.x &&
    firstRect.y < secondRect.y + secondRect.height &&
    firstRect.y + firstRect.height > secondRect.y
  );
}

export function screenToWorld(
  point: Point,
  camera: {
    x: number;
    y: number;
    zoom: number;
  },
) {
  return {
    x: (point.x - camera.x) / camera.zoom,
    y: (point.y - camera.y) / camera.zoom,
  };
}
