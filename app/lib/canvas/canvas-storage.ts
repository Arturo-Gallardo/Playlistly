import { toCanvasVideoWire } from "../playlist/playlist-video";
import type { CanvasTile } from "./canvas-layout";
import type {
  CanvasCameraWire,
  CanvasSnapshotWire,
  CanvasSnapshotWireV1,
  CanvasTileLayoutWire,
  CanvasVideoWire,
} from "../../types/canvas-snapshot";
import type { PlaylistVideoWire } from "../../types/playlist";

export const canvasLayoutStorageKey = "playlistly:canvas-layout";

export function buildCanvasSnapshot({
  videos,
  tiles,
  movedTileIds,
  camera,
  playlistSources,
}: {
  videos: CanvasVideoWire[];
  tiles: CanvasTile[];
  movedTileIds: ReadonlySet<string>;
  camera: CanvasCameraWire;
  playlistSources: string[];
}): CanvasSnapshotWire {
  return {
    version: 2,
    savedAt: Date.now(),
    videos,
    tiles: tiles.map(toCanvasTileLayoutWire),
    movedTileIds: [...movedTileIds],
    camera,
    playlistSources,
  };
}

export function readCanvasSnapshot(): CanvasSnapshotWire | null {
  try {
    const storedValue = window.localStorage.getItem(canvasLayoutStorageKey);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return parseCanvasSnapshotValue(parsedValue);
  } catch {
    return null;
  }
}

export function parseCanvasSnapshotValue(
  parsedValue: unknown,
): CanvasSnapshotWire | null {
  if (isCanvasSnapshotWireV2(parsedValue)) {
    return parsedValue;
  }

  if (isCanvasSnapshotWireV1(parsedValue)) {
    return migrateCanvasSnapshotV1ToV2(parsedValue);
  }

  return null;
}

export function clearCanvasSnapshot() {
  try {
    window.localStorage.removeItem(canvasLayoutStorageKey);
  } catch {
    // storage can be disabled in private browsing
  }
}

export function writeCanvasSnapshot(snapshot: CanvasSnapshotWire): boolean {
  if (snapshot.videos.length === 0) {
    return false;
  }

  try {
    window.localStorage.setItem(
      canvasLayoutStorageKey,
      JSON.stringify(snapshot),
    );
    return true;
  } catch {
    return false;
  }
}

function migrateCanvasSnapshotV1ToV2(
  snapshot: CanvasSnapshotWireV1,
): CanvasSnapshotWire {
  return {
    version: 2,
    savedAt: snapshot.savedAt,
    videos: snapshot.videos.map((video) => ({
      ...video,
      tileId: video.id,
    })),
    tiles: snapshot.tiles,
    movedTileIds: snapshot.movedTileIds,
    camera: snapshot.camera,
    playlistSources: snapshot.playlistSource ? [snapshot.playlistSource] : [],
  };
}

function toCanvasTileLayoutWire(tile: CanvasTile): CanvasTileLayoutWire {
  return {
    id: tile.id,
    x: tile.x,
    y: tile.y,
  };
}

function isCanvasSnapshotWireV2(value: unknown): value is CanvasSnapshotWire {
  return (
    isRecord(value) &&
    value.version === 2 &&
    typeof value.savedAt === "number" &&
    Array.isArray(value.videos) &&
    value.videos.every(isCanvasVideoWire) &&
    Array.isArray(value.tiles) &&
    value.tiles.every(isCanvasTileLayoutWire) &&
    Array.isArray(value.movedTileIds) &&
    value.movedTileIds.every((tileId) => typeof tileId === "string") &&
    isCanvasCameraWire(value.camera) &&
    Array.isArray(value.playlistSources) &&
    value.playlistSources.every((source) => typeof source === "string")
  );
}

function isCanvasSnapshotWireV1(value: unknown): value is CanvasSnapshotWireV1 {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.savedAt === "number" &&
    Array.isArray(value.videos) &&
    value.videos.every(isPlaylistVideoWire) &&
    Array.isArray(value.tiles) &&
    value.tiles.every(isCanvasTileLayoutWire) &&
    Array.isArray(value.movedTileIds) &&
    value.movedTileIds.every((tileId) => typeof tileId === "string") &&
    isCanvasCameraWire(value.camera) &&
    (value.playlistSource === null || typeof value.playlistSource === "string")
  );
}

function isCanvasTileLayoutWire(
  value: unknown,
): value is CanvasTileLayoutWire {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.x === "number" &&
    typeof value.y === "number"
  );
}

function isCanvasCameraWire(value: unknown): value is CanvasCameraWire {
  return (
    isRecord(value) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.zoom === "number"
  );
}

function isCanvasVideoWire(value: unknown): value is CanvasVideoWire {
  return (
    isRecord(value) &&
    typeof value.tileId === "string" &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.url === "string" &&
    isNullableString(value.channelTitle) &&
    isNullableString(value.publishedAt)
  );
}

function isPlaylistVideoWire(value: unknown): value is PlaylistVideoWire {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.url === "string" &&
    isNullableString(value.channelTitle) &&
    isNullableString(value.publishedAt)
  );
}

function isNullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
