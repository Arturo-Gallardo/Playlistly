"use client";

import { useState } from "react";
import type {
  YouTubePlaylist,
  YouTubePlaylistsApiResponse,
} from "../../types/playlist";

export type YouTubePlaylistsLoadStatus = "idle" | "loading" | "ready" | "error";

export function useYouTubePlaylists() {
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [status, setStatus] = useState<YouTubePlaylistsLoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadPlaylists() {
    // the server route reads the google token from the auth cookie
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/youtube-playlists");
      const data = toYouTubePlaylistsApiResponse(await response.json());

      if (!response.ok || "error" in data) {
        setStatus("error");
        setErrorMessage(
          "error" in data ? data.error : "Could not load your playlists.",
        );
        return;
      }

      setPlaylists(data.playlists);
      setStatus("ready");
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the YouTube playlists API.");
    }
  }

  return {
    errorMessage,
    loadPlaylists,
    playlists,
    status,
  };
}

function toYouTubePlaylistsApiResponse(
  data: unknown,
): YouTubePlaylistsApiResponse {
  // only keep playlist objects that match what the picker renders
  if (isRecord(data) && typeof data.error === "string") {
    return { error: data.error };
  }

  if (isRecord(data) && Array.isArray(data.playlists)) {
    return {
      playlists: data.playlists.filter(isYouTubePlaylist),
    };
  }

  return { error: "The playlists response was not readable." };
}

function isYouTubePlaylist(playlist: unknown): playlist is YouTubePlaylist {
  return (
    isRecord(playlist) &&
    typeof playlist.id === "string" &&
    typeof playlist.title === "string" &&
    isNullableString(playlist.thumbnailUrl) &&
    isNullableNumber(playlist.itemCount)
  );
}

function isNullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown) {
  return value === null || typeof value === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
