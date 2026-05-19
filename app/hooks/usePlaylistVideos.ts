"use client";

import { useRef, useState } from "react";
import {
  hydratePlaylistVideos,
  toPlaylistVideoWire,
} from "../lib/playlist-video";
import type {
  PlaylistApiError,
  PlaylistApiSuccess,
  PlaylistVideo,
  PlaylistVideoWire,
} from "../types/playlist";

export type PlaylistLoadStatus = "idle" | "loading" | "ready" | "error";

const playlistCacheKeyPrefix = "playlistly:playlist-videos:";
const playlistCacheTtlMs = 1000 * 60 * 60 * 24;

type PlaylistVideoCacheEntry = {
  savedAt: number;
  videos: PlaylistVideoWire[];
};

export function usePlaylistVideos() {
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<PlaylistLoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function fetchPlaylist(playlist: string): Promise<PlaylistVideo[] | null> {
    const requestId = requestIdRef.current + 1;
    const cachedVideos = getCachedPlaylistVideos(playlist);

    requestIdRef.current = requestId;
    setStatus("loading");
    setErrorMessage(null);

    if (cachedVideos) {
      setStatus("ready");
      void refreshPlaylistVideos(playlist, requestId, false);
      return cachedVideos;
    }

    return refreshPlaylistVideos(playlist, requestId, true);
  }

  async function refreshPlaylistVideos(
    playlist: string,
    requestId: number,
    shouldShowErrors: boolean,
  ): Promise<PlaylistVideo[] | null> {
    try {
      const response = await fetch(
        `/api/youtube-playlist?playlist=${encodeURIComponent(playlist)}`,
      );
      const data = toPlaylistApiResponse(await response.json());

      if (!response.ok || "error" in data) {
        if (shouldShowErrors && requestIdRef.current === requestId) {
          setStatus("error");
          setErrorMessage(
            "error" in data ? data.error : "Could not load that playlist.",
          );
        }
        return null;
      }

      setCachedPlaylistVideos(playlist, data.videos);

      if (requestIdRef.current === requestId) {
        setStatus("ready");
      }

      return data.videos;
    } catch {
      if (shouldShowErrors && requestIdRef.current === requestId) {
        setStatus("error");
        setErrorMessage("Could not reach the playlist API.");
      }
      return null;
    }
  }

  return {
    errorMessage,
    fetchPlaylist,
    status,
  };
}

function getCachedPlaylistVideos(playlist: string) {
  try {
    const cachedValue = window.localStorage.getItem(getPlaylistCacheKey(playlist));

    if (!cachedValue) {
      return null;
    }

    const cachedData: unknown = JSON.parse(cachedValue);

    if (!isPlaylistVideoCacheEntry(cachedData)) {
      const legacyVideos = readLegacyPlaylistVideoCache(cachedData);

      if (!legacyVideos) {
        return null;
      }

      if (Date.now() - legacyVideos.savedAt > playlistCacheTtlMs) {
        window.localStorage.removeItem(getPlaylistCacheKey(playlist));
        return null;
      }

      return legacyVideos.videos;
    }

    if (Date.now() - cachedData.savedAt > playlistCacheTtlMs) {
      window.localStorage.removeItem(getPlaylistCacheKey(playlist));
      return null;
    }

    return hydratePlaylistVideos(cachedData.videos);
  } catch {
    return null;
  }
}

function setCachedPlaylistVideos(playlist: string, videos: PlaylistVideo[]) {
  const cacheEntry: PlaylistVideoCacheEntry = {
    savedAt: Date.now(),
    videos: videos.map(toPlaylistVideoWire),
  };

  try {
    window.localStorage.setItem(
      getPlaylistCacheKey(playlist),
      JSON.stringify(cacheEntry),
    );
  } catch {
    // storage can be full or disabled, but loading should still work
  }
}

function getPlaylistCacheKey(playlist: string) {
  return `${playlistCacheKeyPrefix}${playlist.trim()}`;
}

function isPlaylistVideoCacheEntry(
  value: unknown,
): value is PlaylistVideoCacheEntry {
  return (
    isRecord(value) &&
    typeof value.savedAt === "number" &&
    Array.isArray(value.videos) &&
    value.videos.every(isPlaylistVideoWire)
  );
}

function readLegacyPlaylistVideoCache(value: unknown) {
  if (
    !isRecord(value) ||
    typeof value.savedAt !== "number" ||
    !Array.isArray(value.videos)
  ) {
    return null;
  }

  const legacyVideos = value.videos.filter(isLegacyPlaylistVideo);

  if (legacyVideos.length !== value.videos.length) {
    return null;
  }

  return {
    savedAt: value.savedAt,
    videos: legacyVideos,
  };
}

function toPlaylistApiResponse(
  data: unknown,
): PlaylistApiSuccess | PlaylistApiError {
  if (isRecord(data) && typeof data.error === "string") {
    return { error: data.error };
  }

  if (isRecord(data) && Array.isArray(data.videos)) {
    const wireVideos = data.videos.filter(isPlaylistVideoWire);

    if (wireVideos.length === data.videos.length) {
      return {
        videos: hydratePlaylistVideos(wireVideos),
      };
    }

    const legacyVideos = data.videos.filter(isLegacyPlaylistVideo);

    if (legacyVideos.length === data.videos.length) {
      return { videos: legacyVideos };
    }
  }

  return { error: "The playlist response was not readable." };
}

function isPlaylistVideoWire(video: unknown): video is PlaylistVideoWire {
  return (
    isRecord(video) &&
    typeof video.id === "string" &&
    typeof video.title === "string" &&
    typeof video.url === "string" &&
    isNullableString(video.channelTitle) &&
    isNullableString(video.publishedAt) &&
    !("thumbnailUrls" in video)
  );
}

function isLegacyPlaylistVideo(video: unknown): video is PlaylistVideo {
  return (
    isRecord(video) &&
    typeof video.id === "string" &&
    typeof video.title === "string" &&
    typeof video.url === "string" &&
    isNullableString(video.thumbnailUrl) &&
    isPlaylistVideoThumbnails(video.thumbnailUrls) &&
    isNullableString(video.channelTitle) &&
    isNullableString(video.publishedAt)
  );
}

function isPlaylistVideoThumbnails(value: unknown) {
  return (
    isRecord(value) &&
    isNullableString(value.default) &&
    isNullableString(value.medium) &&
    isNullableString(value.high)
  );
}

function isNullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
