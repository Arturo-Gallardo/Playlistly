import { canvasTileConfig } from "./canvas-layout";
import { hydratePlaylistVideo, toPlaylistVideoWire } from "./playlist-video";
import type { CanvasTile, Point } from "./canvas-layout";
import type { PlaylistVideo, PlaylistVideoWire } from "../types/playlist";

export const tileClipboardMarker = "playlistly-tile-clipboard-v1";

export type TileClipboardEntryWire = {
  relativeX: number;
  relativeY: number;
  video: PlaylistVideoWire;
};

export type TileClipboardPayload = {
  anchorX: number;
  anchorY: number;
  tiles: TileClipboardEntryWire[];
  version: 1;
};

export function buildTileClipboardPayload(
  selectedTiles: CanvasTile[],
): TileClipboardPayload | null {
  if (selectedTiles.length === 0) {
    return null;
  }

  let anchorX = selectedTiles[0].x;
  let anchorY = selectedTiles[0].y;

  for (const tile of selectedTiles) {
    anchorX = Math.min(anchorX, tile.x);
    anchorY = Math.min(anchorY, tile.y);
  }

  return {
    version: 1,
    anchorX,
    anchorY,
    tiles: selectedTiles.map((tile) => ({
      relativeX: tile.x - anchorX,
      relativeY: tile.y - anchorY,
      video: toPlaylistVideoWire(tile.video),
    })),
  };
}

export function getPasteOffsetMultiplier(pasteCount: number) {
  const step = canvasTileConfig.gap * 4;
  return {
    x: step * pasteCount,
    y: step * pasteCount,
  };
}

export function buildPastedTileEntries(
  payload: TileClipboardPayload,
  pasteCount: number,
) {
  const offset = getPasteOffsetMultiplier(pasteCount);
  const originX = payload.anchorX + offset.x;
  const originY = payload.anchorY + offset.y;

  return buildPastedTileEntriesAtOrigin(payload, { x: originX, y: originY });
}

export function buildPastedTileEntriesAtWorldPoint(
  payload: TileClipboardPayload,
  worldPoint: Point,
) {
  return buildPastedTileEntriesAtOrigin(payload, worldPoint);
}

export function getTilesTopLeftAnchor(tiles: Array<{ x: number; y: number }>) {
  if (tiles.length === 0) {
    return { x: 0, y: 0 };
  }

  let anchorX = tiles[0].x;
  let anchorY = tiles[0].y;

  for (const tile of tiles) {
    anchorX = Math.min(anchorX, tile.x);
    anchorY = Math.min(anchorY, tile.y);
  }

  return { x: anchorX, y: anchorY };
}

export function buildReplacePasteEntries(
  payload: TileClipboardPayload,
  anchorPositions: Point[],
) {
  if (payload.tiles.length === 0) {
    return [];
  }

  const origin = getTilesTopLeftAnchor(anchorPositions);

  return buildPastedTileEntriesAtOrigin(payload, origin);
}

export function sortTilesByPosition(tiles: CanvasTile[]) {
  return [...tiles].sort((leftTile, rightTile) => {
    if (leftTile.y !== rightTile.y) {
      return leftTile.y - rightTile.y;
    }

    return leftTile.x - rightTile.x;
  });
}

function buildPastedTileEntriesAtOrigin(
  payload: TileClipboardPayload,
  origin: Point,
) {
  return payload.tiles.map((entry) => ({
    video: hydratePlaylistVideo(entry.video),
    x: origin.x + entry.relativeX,
    y: origin.y + entry.relativeY,
  }));
}

export function serializeTileClipboardPayload(payload: TileClipboardPayload) {
  return JSON.stringify({
    marker: tileClipboardMarker,
    payload,
  });
}

export function parseTileClipboardText(
  value: string,
): TileClipboardPayload | null {
  try {
    const parsedValue: unknown = JSON.parse(value);

    if (!isRecord(parsedValue) || parsedValue.marker !== tileClipboardMarker) {
      return null;
    }

    const payload = parsedValue.payload;

    if (!isTileClipboardPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function isTileClipboardPayload(value: unknown): value is TileClipboardPayload {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.anchorX === "number" &&
    typeof value.anchorY === "number" &&
    Array.isArray(value.tiles) &&
    value.tiles.every(isTileClipboardEntryWire)
  );
}

function isTileClipboardEntryWire(
  value: unknown,
): value is TileClipboardEntryWire {
  return (
    isRecord(value) &&
    typeof value.relativeX === "number" &&
    typeof value.relativeY === "number" &&
    isRecord(value.video) &&
    typeof value.video.id === "string" &&
    typeof value.video.title === "string" &&
    typeof value.video.url === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
