import type { CanvasTile } from "./canvas-layout";

const maxListedMatches = 12;

export function findTilesByVideoQuery(tiles: CanvasTile[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return tiles
    .filter((tile) => {
      const title = tile.video.title.toLowerCase();
      const channel = tile.video.channelTitle?.toLowerCase() ?? "";

      return title.includes(normalized) || channel.includes(normalized);
    })
    .sort((left, right) =>
      left.video.title.localeCompare(right.video.title, undefined, {
        sensitivity: "base",
      }),
    );
}

export function getListedVideoSearchMatches(matches: CanvasTile[]) {
  return {
    listed: matches.slice(0, maxListedMatches),
    overflowCount: Math.max(0, matches.length - maxListedMatches),
  };
}
