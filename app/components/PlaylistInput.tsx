"use client";

import { useState, type FormEvent } from "react";
import type { PlaylistLoadStatus } from "../hooks/usePlaylistVideos";

type PlaylistInputProps = {
  errorMessage: string | null;
  onLoad: (playlist: string) => Promise<void>;
  status: PlaylistLoadStatus;
};

export function PlaylistInput({
  errorMessage,
  onLoad,
  status,
}: PlaylistInputProps) {
  const [playlist, setPlaylist] = useState("");
  const isLoading = status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!playlist.trim() || isLoading) {
      return;
    }

    await onLoad(playlist);
  }

  return (
    <form
      className="pointer-events-auto flex min-w-0 items-start gap-3"
      onSubmit={handleSubmit}
    >
      <div className="toolbar-logo">PL</div>

      <div className="min-w-0">
        <label className="sr-only" htmlFor="playlist-url">
          youtube playlist link
        </label>
        <input
          className="toolbar-input"
          disabled={isLoading}
          id="playlist-url"
          onChange={(event) => setPlaylist(event.target.value)}
          placeholder="paste a youtube playlist link"
          type="text"
          value={playlist}
        />
        {errorMessage ? (
          <p className="font-control mt-2 max-w-80 text-xs text-[#CA3E47]">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <button className="toolbar-button" disabled={isLoading} type="submit">
        {isLoading ? "loading" : "load"}
      </button>
    </form>
  );
}
