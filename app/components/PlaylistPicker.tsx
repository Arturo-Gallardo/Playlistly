"use client";

import Image from "next/image";
import type { YouTubePlaylistsLoadStatus } from "../hooks/useYouTubePlaylists";
import type { YouTubePlaylist } from "../types/playlist";

type PlaylistPickerProps = {
  errorMessage: string | null;
  isOpen: boolean;
  onRefresh: () => Promise<void>;
  onSelect: (playlistId: string) => Promise<void>;
  playlists: YouTubePlaylist[];
  status: YouTubePlaylistsLoadStatus;
};

export function PlaylistPicker({
  errorMessage,
  isOpen,
  onRefresh,
  onSelect,
  playlists,
  status,
}: PlaylistPickerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="playlist-picker-panel pointer-events-auto absolute left-1/2 top-16 z-30 w-80 rounded-md border border-white/20 bg-[#111111]/95 p-3 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-control text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
          your playlists
        </h2>
        <button
          className="toolbar-button px-3 py-1 text-[10px]"
          disabled={status === "loading"}
          onClick={() => void onRefresh()}
          type="button"
        >
          refresh
        </button>
      </div>

      {status === "loading" ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="playlist-loading-card flex items-center gap-3 rounded-md border border-white/10 p-2"
              key={index}
            >
              <span className="block aspect-video w-20 shrink-0 rounded bg-white/10" />
              <span className="flex-1 space-y-2">
                <span className="block h-2.5 w-11/12 rounded-full bg-white/10" />
                <span className="block h-2 w-1/2 rounded-full bg-white/10" />
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="font-control text-xs text-[#CA3E47]">{errorMessage}</p>
      ) : null}

      {status === "ready" && playlists.length === 0 ? (
        <p className="font-control text-xs text-white/60">
          no playlists found on this account.
        </p>
      ) : null}

      {/* hide old rows during refresh so the skeleton does not stack on top */}
      {status !== "loading" ? (
        <div className="playlist-picker-scroll max-h-96 space-y-2 overflow-y-auto pr-1">
          {playlists.map((playlist) => (
            <button
              className="group flex w-full items-center gap-3 border border-white/10 p-2 text-left transition hover:border-[#CA3E47] hover:bg-white/5"
              key={playlist.id}
              onClick={() => void onSelect(playlist.id)}
              type="button"
            >
              <span className="relative block aspect-video w-20 shrink-0 overflow-hidden bg-white/5">
                {playlist.thumbnailUrl ? (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="80px"
                    src={playlist.thumbnailUrl}
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="font-control line-clamp-2 block text-xs font-semibold text-white">
                  {playlist.title}
                </span>
                <span className="mt-1 block text-[11px] text-white/50">
                  {formatPlaylistCount(playlist.itemCount)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatPlaylistCount(itemCount: number | null) {
  if (itemCount === null) {
    return "playlist";
  }

  return `${itemCount} ${itemCount === 1 ? "video" : "videos"}`;
}
