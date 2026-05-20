export const playlistVideoCacheKeyPrefix = "playlistly:playlist-videos:";

export function getPlaylistVideoCacheKey(playlist: string) {
  return `${playlistVideoCacheKeyPrefix}${playlist.trim()}`;
}

export function clearAllPlaylistVideoCache() {
  if (typeof window === "undefined") {
    return 0;
  }

  let clearedCount = 0;

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith(playlistVideoCacheKeyPrefix)) {
      window.localStorage.removeItem(key);
      clearedCount += 1;
    }
  }

  return clearedCount;
}
