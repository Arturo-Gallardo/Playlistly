"use client";

import { useState, type FormEvent } from "react";
import type { PlaylistLoadStatus } from "../hooks/usePlaylistVideos";
import { ToolbarPressButton } from "./ToolbarPressButton";
import { ToolbarTooltipWrap } from "./ToolbarTooltipWrap";

type PlaylistInputProps = {
  areVideoDetailsHidden: boolean;
  errorMessage: string | null;
  hasTilesOnCanvas: boolean;
  onLoad: (playlist: string) => Promise<void>;
  onVideoDetailsToggle: () => void;
  status: PlaylistLoadStatus;
};

export function PlaylistInput({
  areVideoDetailsHidden,
  errorMessage,
  hasTilesOnCanvas,
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
      className="pointer-events-auto flex min-w-0 items-center gap-3"
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

      <div className="min-w-0" data-onboarding-target="playlist-input">
        <label className="sr-only" htmlFor="playlist-url">
          youtube playlist link
        </label>
        <input
          className="toolbar-input"
          disabled={isLoading}
          id="playlist-url"
          onChange={(event) => setPlaylist(event.target.value)}
          placeholder={
            hasTilesOnCanvas
              ? "Paste another playlist link"
              : "Paste a youtube playlist link"
          }
          type="text"
          value={playlist}
        />
        {errorMessage ? (
          <p className="font-control mt-2 max-w-80 text-xs text-[#CA3E47]">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <ToolbarTooltipWrap label="Load playlist">
        <ToolbarPressButton disabled={isLoading} type="submit" variant="pill">
          {isLoading ? "loading" : "load"}
        </ToolbarPressButton>
      </ToolbarTooltipWrap>
      <ToolbarTooltipWrap
        label={areVideoDetailsHidden ? "Show details" : "Hide details"}
      >
        <ToolbarPressButton
          aria-pressed={!areVideoDetailsHidden}
          className={areVideoDetailsHidden ? undefined : "toolbar-button-active"}
          onClick={onVideoDetailsToggle}
          variant="pill"
        >
          details
        </ToolbarPressButton>
      </ToolbarTooltipWrap>
    </form>
  );
}
