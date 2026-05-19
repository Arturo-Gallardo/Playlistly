"use client";

import { useState, type FormEvent } from "react";
import type { PlaylistLoadStatus } from "../hooks/usePlaylistVideos";

type PlaylistInputProps = {
  areVideoDetailsHidden: boolean;
  errorMessage: string | null;
  onLoad: (playlist: string) => Promise<void>;
  onVideoDetailsToggle: () => void;
  status: PlaylistLoadStatus;
};

export function PlaylistInput({
  areVideoDetailsHidden,
  errorMessage,
  onLoad,
  onVideoDetailsToggle,
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
      <div className="toolbar-logo">
        <img
          alt="Playlistly"
          className="size-full object-contain"
          decoding="async"
          fetchPriority="high"
          height={44}
          src="/PlaylistlyLogo.png"
          width={44}
        />
      </div>

      <div className="min-w-0">
        <label className="sr-only" htmlFor="playlist-url">
          youtube playlist link
        </label>
        <input
          className="toolbar-input"
          disabled={isLoading}
          id="playlist-url"
          onChange={(event) => setPlaylist(event.target.value)}
          placeholder="Paste a youtube playlist link"
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
      <button
        aria-pressed={!areVideoDetailsHidden}
        className={`toolbar-button ${areVideoDetailsHidden ? "" : "toolbar-button-active"}`}
        onClick={onVideoDetailsToggle}
        type="button"
      >
        details
      </button>
    </form>
  );
}
