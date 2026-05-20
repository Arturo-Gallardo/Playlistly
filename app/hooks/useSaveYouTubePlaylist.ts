"use client";

import { useCallback, useState } from "react";
import type {
  SaveYouTubePlaylistApiResponse,
  SaveYouTubePlaylistRequest,
  SaveYouTubePlaylistSuccess,
} from "../types/playlist";

export type SaveYouTubePlaylistStatus = "idle" | "loading" | "success" | "error";

export function useSaveYouTubePlaylist() {
  const [status, setStatus] = useState<SaveYouTubePlaylistStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SaveYouTubePlaylistSuccess | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
    setResult(null);
  }, []);

  const savePlaylist = useCallback(async (payload: SaveYouTubePlaylistRequest) => {
    setStatus("loading");
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch("/api/youtube-playlist/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = toSaveYouTubePlaylistApiResponse(await response.json());

      if (!response.ok || "error" in data) {
        setStatus("error");
        setErrorMessage(
          "error" in data ? data.error : "Could not save the playlist to YouTube.",
        );
        return null;
      }

      setStatus("success");
      setResult(data);
      return data;
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the YouTube save API.");
      return null;
    }
  }, []);

  return {
    errorMessage,
    reset,
    result,
    savePlaylist,
    status,
  };
}

function toSaveYouTubePlaylistApiResponse(
  data: unknown,
): SaveYouTubePlaylistApiResponse {
  if (isRecord(data) && typeof data.error === "string") {
    return { error: data.error };
  }

  if (
    isRecord(data) &&
    typeof data.playlistId === "string" &&
    typeof data.playlistUrl === "string"
  ) {
    return {
      playlistId: data.playlistId,
      playlistUrl: data.playlistUrl,
    };
  }

  return { error: "The save response was not readable." };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
