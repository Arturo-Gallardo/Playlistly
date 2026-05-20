import type { CanvasTile } from "./canvas-layout";
import { sortTilesByPosition } from "./tile-clipboard";
import type { PlaylistVideo } from "../types/playlist";

export function getVideosFromSelectedTiles(
  tiles: CanvasTile[],
  selectedTileIds: ReadonlySet<string>,
) {
  const selectedTiles = tiles.filter((tile) => selectedTileIds.has(tile.id));

  return sortTilesByPosition(selectedTiles).map((tile) => tile.video);
}

export function getDefaultExportPlaylistTitle() {
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date());

  return `Playlistly export – ${formattedDate}`;
}

export function getOrderedVideoIds(videos: PlaylistVideo[]) {
  return videos.map((video) => video.id);
}
