"use client";

import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useReorderableList } from "../hooks/useReorderableList";
import { useSaveYouTubePlaylist } from "../hooks/useSaveYouTubePlaylist";
import type { YouTubePlaylistsLoadStatus } from "../hooks/useYouTubePlaylists";
import { cn } from "../lib/cn";
import {
  getDefaultExportPlaylistTitle,
  getOrderedVideoIds,
} from "../lib/playlist-export";
import type {
  PlaylistVideo,
  SaveYouTubePlaylistMode,
  YouTubePlaylist,
  YouTubePlaylistPrivacyStatus,
} from "../types/playlist";
import { SavePlaylistVideoList } from "./SavePlaylistVideoList";

type SavePlaylistDialogProps = {
  initialVideos: PlaylistVideo[];
  onClose: () => void;
  onSaved: (message: string, playlistUrl: string) => void;
  playlists: YouTubePlaylist[];
  playlistsErrorMessage: string | null;
  playlistsStatus: YouTubePlaylistsLoadStatus;
  onLoadPlaylists: () => Promise<void>;
};

const privacyOptions: Array<{
  label: string;
  value: YouTubePlaylistPrivacyStatus;
}> = [
  { label: "Unlisted", value: "unlisted" },
  { label: "Private", value: "private" },
  { label: "Public", value: "public" },
];

export function SavePlaylistDialog({
  initialVideos,
  onClose,
  onSaved,
  playlists,
  playlistsErrorMessage,
  playlistsStatus,
  onLoadPlaylists,
}: SavePlaylistDialogProps) {
  const dialogTitleId = useId();
  const { status: authStatus } = useSession();
  const isSignedIn = authStatus === "authenticated";
  const { items, reorderItems, resetItems } =
    useReorderableList(initialVideos);
  const { errorMessage, reset, result, savePlaylist, status } =
    useSaveYouTubePlaylist();
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<SaveYouTubePlaylistMode>("new");
  const [title, setTitle] = useState(getDefaultExportPlaylistTitle);
  const [privacyStatus, setPrivacyStatus] =
    useState<YouTubePlaylistPrivacyStatus>("unlisted");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    resetItems(initialVideos);
    reset();
    setTitle(getDefaultExportPlaylistTitle());
    setMode("new");
    setPrivacyStatus("unlisted");
    setSelectedPlaylistId(null);
  }, [initialVideos, reset, resetItems]);

  useEffect(() => {
    if (mode === "existing" && playlistsStatus === "idle" && isSignedIn) {
      void onLoadPlaylists();
    }
  }, [isSignedIn, mode, onLoadPlaylists, playlistsStatus]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && status !== "loading") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, status]);

  useEffect(() => {
    if (!result) {
      return;
    }

    onSaved("playlist saved to youtube", result.playlistUrl);
    onClose();
  }, [onClose, onSaved, result]);

  async function handleSave() {
    if (!isSignedIn || items.length === 0 || status === "loading") {
      return;
    }

    const videoIds = getOrderedVideoIds(items);

    if (mode === "new") {
      const trimmedTitle = title.trim();

      if (!trimmedTitle) {
        return;
      }

      await savePlaylist({
        mode: "new",
        videoIds,
        title: trimmedTitle,
        privacyStatus,
      });
      return;
    }

    if (!selectedPlaylistId) {
      return;
    }

    await savePlaylist({
      mode: "existing",
      videoIds,
      playlistId: selectedPlaylistId,
    });
  }

  const canSave =
    isSignedIn &&
    items.length > 0 &&
    status !== "loading" &&
    (mode === "new" ? title.trim().length > 0 : selectedPlaylistId !== null);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <>
      <button
        aria-label="close save playlist dialog"
        className="fixed inset-0 z-[110] cursor-default bg-black/55"
        disabled={status === "loading"}
        onClick={onClose}
        type="button"
      />
      <div className="pointer-events-none fixed inset-0 z-[111] grid place-items-center p-4">
        <div
          aria-labelledby={dialogTitleId}
          aria-modal="true"
          className="save-playlist-dialog pointer-events-auto font-control flex max-h-[min(88vh,44rem)] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-xl border border-white/15 bg-[#111111]/95 p-4 shadow-[0_18px_48px_rgb(0_0_0/0.55)] backdrop-blur-md sm:p-5"
          onPointerDown={(event) => event.stopPropagation()}
          role="dialog"
        >
          <header className="space-y-1">
            <h2
              className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75"
              id={dialogTitleId}
            >
              save to youtube
            </h2>
            <p className="text-[11px] text-white/50">
              drag videos to reorder before saving. default order follows the
              canvas (left to right, top to bottom).
            </p>
          </header>

          <section className="min-h-0 space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              playlist order
            </h3>
            <SavePlaylistVideoList items={items} onReorder={reorderItems} />
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              destination
            </h3>
            <ModeToggle mode={mode} onModeChange={setMode} />

            {mode === "new" ? (
              <NewPlaylistFields
                privacyStatus={privacyStatus}
                title={title}
                onPrivacyChange={setPrivacyStatus}
                onTitleChange={setTitle}
              />
            ) : (
              <ExistingPlaylistPicker
                errorMessage={playlistsErrorMessage}
                onRefresh={() => void onLoadPlaylists()}
                onSelect={setSelectedPlaylistId}
                playlists={playlists}
                selectedPlaylistId={selectedPlaylistId}
                status={playlistsStatus}
              />
            )}
          </section>

          {!isSignedIn ? (
            <p className="text-xs text-white/55">
              sign in with google to create or update youtube playlists.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="text-xs text-[#CA3E47]">{errorMessage}</p>
          ) : null}

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-3">
            <button
              className="toolbar-button px-4 py-2 text-[10px]"
              disabled={status === "loading"}
              onClick={onClose}
              type="button"
            >
              cancel
            </button>
            {!isSignedIn ? (
              <button
                className="toolbar-button px-4 py-2 text-[10px]"
                onClick={() => void signIn("google")}
                type="button"
              >
                sign in with google
              </button>
            ) : (
              <button
                className="toolbar-button px-4 py-2 text-[10px] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canSave}
                onClick={() => void handleSave()}
                type="button"
              >
                {status === "loading" ? "saving…" : "save to youtube"}
              </button>
            )}
          </footer>
        </div>
      </div>
    </>,
    document.body,
  );
}

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: SaveYouTubePlaylistMode;
  onModeChange: (mode: SaveYouTubePlaylistMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ModeButton
        isActive={mode === "new"}
        label="new playlist"
        onClick={() => onModeChange("new")}
      />
      <ModeButton
        isActive={mode === "existing"}
        label="existing playlist"
        onClick={() => onModeChange("existing")}
      />
    </div>
  );
}

function ModeButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded-md border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition",
        isActive
          ? "border-[#CA3E47] bg-[#CA3E47]/15 text-white"
          : "border-white/15 text-white/55 hover:border-white/30 hover:text-white/80",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function NewPlaylistFields({
  onPrivacyChange,
  onTitleChange,
  privacyStatus,
  title,
}: {
  onPrivacyChange: (value: YouTubePlaylistPrivacyStatus) => void;
  onTitleChange: (value: string) => void;
  privacyStatus: YouTubePlaylistPrivacyStatus;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
          title
        </span>
        <input
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none transition focus:border-[#CA3E47]"
          onChange={(event) => onTitleChange(event.target.value)}
          type="text"
          value={title}
        />
      </label>
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
          privacy
        </span>
        <div className="grid grid-cols-3 gap-2">
          {privacyOptions.map((option) => (
            <button
              className={cn(
                "rounded-md border px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] transition",
                privacyStatus === option.value
                  ? "border-[#CA3E47] bg-[#CA3E47]/15 text-white"
                  : "border-white/15 text-white/55 hover:border-white/30 hover:text-white/80",
              )}
              key={option.value}
              onClick={() => onPrivacyChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExistingPlaylistPicker({
  errorMessage,
  onRefresh,
  onSelect,
  playlists,
  selectedPlaylistId,
  status,
}: {
  errorMessage: string | null;
  onRefresh: () => void;
  onSelect: (playlistId: string) => void;
  playlists: YouTubePlaylist[];
  selectedPlaylistId: string | null;
  status: YouTubePlaylistsLoadStatus;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
          pick a playlist
        </span>
        <button
          className="toolbar-button px-2 py-1 text-[10px]"
          disabled={status === "loading"}
          onClick={onRefresh}
          type="button"
        >
          refresh
        </button>
      </div>

      {status === "loading" ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              className="playlist-loading-card h-14 rounded-md border border-white/10"
              key={index}
            />
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-xs text-[#CA3E47]">{errorMessage}</p>
      ) : null}

      {status === "ready" && playlists.length === 0 ? (
        <p className="text-xs text-white/55">no playlists found on this account.</p>
      ) : null}

      {status !== "loading" ? (
        <div className="playlist-picker-scroll max-h-40 space-y-1.5 overflow-y-auto pr-1">
          {playlists.map((playlist) => (
            <button
              className={cn(
                "flex w-full items-center gap-2 rounded-md border p-2 text-left transition",
                selectedPlaylistId === playlist.id
                  ? "border-[#CA3E47] bg-[#CA3E47]/10"
                  : "border-white/10 hover:border-white/25 hover:bg-white/5",
              )}
              key={playlist.id}
              onClick={() => onSelect(playlist.id)}
              type="button"
            >
              <span className="relative block aspect-video w-14 shrink-0 overflow-hidden rounded bg-white/5">
                {playlist.thumbnailUrl ? (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={playlist.thumbnailUrl}
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[11px] font-semibold text-white">
                  {playlist.title}
                </span>
                <span className="mt-0.5 block text-[10px] text-white/50">
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
