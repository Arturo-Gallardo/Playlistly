import {
  normalizeRect,
  rectsIntersect,
  type CanvasTile,
  type Point,
  type Rect,
} from "./canvas-layout";

export function getTilesInsideRect(tiles: CanvasTile[], rect: Rect) {
  const selectedIds = new Set<string>();

  for (const tile of tiles) {
    if (rectsIntersect(tile, rect)) {
      selectedIds.add(tile.id);
    }
  }

  return selectedIds;
}

export function resolveMarqueeSelection({
  baseSelection,
  isAdditive,
  tiles,
  startWorldPoint,
  endWorldPoint,
}: {
  baseSelection: Set<string>;
  isAdditive: boolean;
  tiles: CanvasTile[];
  startWorldPoint: Point;
  endWorldPoint: Point;
}) {
  const rect = normalizeRect(startWorldPoint, endWorldPoint);
  const hits = getTilesInsideRect(tiles, rect);

  if (!isAdditive) {
    return hits;
  }

  return new Set([...baseSelection, ...hits]);
}

export function getNextSelectedTileIds({
  isAdditive,
  selectedTileIds,
  tileId,
}: {
  isAdditive: boolean;
  selectedTileIds: Set<string>;
  tileId: string;
}) {
  if (!isAdditive) {
    return selectedTileIds.has(tileId) ? selectedTileIds : new Set([tileId]);
  }

  const nextSelectedTileIds = new Set(selectedTileIds);

  if (nextSelectedTileIds.has(tileId)) {
    nextSelectedTileIds.delete(tileId);
  } else {
    nextSelectedTileIds.add(tileId);
  }

  return nextSelectedTileIds;
}
