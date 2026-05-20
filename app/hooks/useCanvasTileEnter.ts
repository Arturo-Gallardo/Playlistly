"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaylistLoadStatus } from "./usePlaylistVideos";

const tileEnterDurationMs = 900;

export function useCanvasTileEnter(
  tileCount: number,
  playlistStatus: PlaylistLoadStatus,
) {
  const [isTileEnterActive, setIsTileEnterActive] = useState(false);
  const previousTileCountRef = useRef(0);
  const previousStatusRef = useRef(playlistStatus);

  useEffect(() => {
    const previousTileCount = previousTileCountRef.current;
    const previousStatus = previousStatusRef.current;

    previousTileCountRef.current = tileCount;
    previousStatusRef.current = playlistStatus;

    const gainedTiles = tileCount > previousTileCount;
    const fromEmpty = previousTileCount === 0 && tileCount > 0;
    const finishedLoading =
      previousStatus === "loading" && playlistStatus !== "loading";

    if (tileCount === 0 || (!fromEmpty && !(gainedTiles && finishedLoading))) {
      return;
    }

    setIsTileEnterActive(true);
    const enterTimer = setTimeout(() => {
      setIsTileEnterActive(false);
    }, tileEnterDurationMs);

    return () => clearTimeout(enterTimer);
  }, [tileCount, playlistStatus]);

  return isTileEnterActive;
}
