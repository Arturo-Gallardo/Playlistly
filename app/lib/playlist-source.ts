/** Normalize playlist URLs/ids for duplicate checks on the canvas. */
export function normalizePlaylistSource(source: string) {
  return source.trim().toLowerCase();
}

export function playlistSourcesInclude(
  sources: readonly string[],
  candidate: string,
) {
  const normalizedCandidate = normalizePlaylistSource(candidate);

  return sources.some(
    (source) => normalizePlaylistSource(source) === normalizedCandidate,
  );
}
