import type {
  CanvasTileLayoutWire,
  CanvasVideoWire,
} from "../types/canvas-snapshot";

export type TileLayoutCheckpoint = {
  movedTileIds: string[];
  playlistSources: string[];
  tiles: CanvasTileLayoutWire[];
  videos: CanvasVideoWire[];
};

export function createTileLayoutCheckpoint({
  tiles,
  movedTileIds,
  playlistSources,
  videos,
}: {
  tiles: Array<{ id: string; x: number; y: number }>;
  movedTileIds: ReadonlySet<string>;
  playlistSources: string[];
  videos: CanvasVideoWire[];
}): TileLayoutCheckpoint {
  return {
    movedTileIds: [...movedTileIds],
    playlistSources: [...playlistSources],
    tiles: tiles.map((tile) => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
    })),
    videos: videos.map((video) => ({ ...video })),
  };
}

export function areTileLayoutCheckpointsEqual(
  firstCheckpoint: TileLayoutCheckpoint,
  secondCheckpoint: TileLayoutCheckpoint,
) {
  if (firstCheckpoint.movedTileIds.length !== secondCheckpoint.movedTileIds.length) {
    return false;
  }

  const firstMovedTileIds = [...firstCheckpoint.movedTileIds].sort();
  const secondMovedTileIds = [...secondCheckpoint.movedTileIds].sort();

  for (let index = 0; index < firstMovedTileIds.length; index += 1) {
    if (firstMovedTileIds[index] !== secondMovedTileIds[index]) {
      return false;
    }
  }

  if (firstCheckpoint.tiles.length !== secondCheckpoint.tiles.length) {
    return false;
  }

  if (firstCheckpoint.playlistSources.length !== secondCheckpoint.playlistSources.length) {
    return false;
  }

  const firstPlaylistSources = [...firstCheckpoint.playlistSources];
  const secondPlaylistSources = [...secondCheckpoint.playlistSources];

  for (let index = 0; index < firstPlaylistSources.length; index += 1) {
    if (firstPlaylistSources[index] !== secondPlaylistSources[index]) {
      return false;
    }
  }

  if (firstCheckpoint.videos.length !== secondCheckpoint.videos.length) {
    return false;
  }

  const firstTiles = [...firstCheckpoint.tiles].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const secondTiles = [...secondCheckpoint.tiles].sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  for (let index = 0; index < firstTiles.length; index += 1) {
    const firstTile = firstTiles[index];
    const secondTile = secondTiles[index];

    if (
      firstTile.id !== secondTile.id ||
      firstTile.x !== secondTile.x ||
      firstTile.y !== secondTile.y
    ) {
      return false;
    }
  }

  const firstVideos = [...firstCheckpoint.videos].sort((left, right) =>
    left.tileId.localeCompare(right.tileId),
  );
  const secondVideos = [...secondCheckpoint.videos].sort((left, right) =>
    left.tileId.localeCompare(right.tileId),
  );

  for (let index = 0; index < firstVideos.length; index += 1) {
    const firstVideo = firstVideos[index];
    const secondVideo = secondVideos[index];

    if (
      firstVideo.tileId !== secondVideo.tileId ||
      firstVideo.id !== secondVideo.id ||
      firstVideo.title !== secondVideo.title ||
      firstVideo.url !== secondVideo.url ||
      firstVideo.channelTitle !== secondVideo.channelTitle ||
      firstVideo.publishedAt !== secondVideo.publishedAt
    ) {
      return false;
    }
  }

  return true;
}
