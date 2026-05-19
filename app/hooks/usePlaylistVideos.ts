"use client";

import { useState } from "react";
import type { PlaylistApiResponse, PlaylistVideo } from "../types/playlist";

export type PlaylistLoadStatus = "idle" | "loading" | "ready" | "error";

export function usePlaylistVideos(initialVideos: PlaylistVideo[]) {
  const [videos, setVideos] = useState(initialVideos);
  const [status, setStatus] = useState<PlaylistLoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadPlaylist(playlist: string) {
    // this handles both pasted urls and playlist ids from the picker
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/youtube-playlist?playlist=${encodeURIComponent(playlist)}`,
      );
      const data = toPlaylistApiResponse(await response.json());

      if (!response.ok || "error" in data) {
        setStatus("error");
        setErrorMessage(
          "error" in data ? data.error : "Could not load that playlist.",
        );
        return false;
      }

      setVideos(data.videos);
      setStatus("ready");
      return true;
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the playlist API.");
      return false;
    }
  }

  return {
    errorMessage,
    loadPlaylist,
    status,
    videos,
  };
}

function toPlaylistApiResponse(data: unknown): PlaylistApiResponse {
  // fetch gives unknown json, so keep the client state strict before using it
  if (isRecord(data) && typeof data.error === "string") {
    return { error: data.error };
  }

  if (isRecord(data) && Array.isArray(data.videos)) {
    return {
      videos: data.videos.filter(isPlaylistVideo),
    };
  }

  return { error: "The playlist response was not readable." };
}

function isPlaylistVideo(video: unknown): video is PlaylistVideo {
  return (
    isRecord(video) &&
    typeof video.id === "string" &&
    typeof video.title === "string" &&
    typeof video.url === "string" &&
    isNullableString(video.thumbnailUrl) &&
    isNullableString(video.channelTitle) &&
    isNullableString(video.publishedAt)
  );
}

function isNullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
