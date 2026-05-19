"use client";

import { Settings } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import type { PlaylistLoadStatus } from "../hooks/usePlaylistVideos";
import { useYouTubePlaylists } from "../hooks/useYouTubePlaylists";
import { AccountMenu } from "./AccountMenu";
import { PlaylistInput } from "./PlaylistInput";
import { PlaylistPicker } from "./PlaylistPicker";

type AppToolbarProps = {
  areVideoDetailsHidden: boolean;
  errorMessage: string | null;
  onPlaylistLoad: (playlist: string) => Promise<void>;
  onVideoDetailsToggle: () => void;
  playlistStatus: PlaylistLoadStatus;
};

export function AppToolbar({
  areVideoDetailsHidden,
  errorMessage,
  onPlaylistLoad,
  onVideoDetailsToggle,
  playlistStatus,
}: AppToolbarProps) {
  const { data: session, status: authStatus } = useSession();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const {
    errorMessage: playlistsErrorMessage,
    loadPlaylists,
    playlists,
    status: playlistsStatus,
  } = useYouTubePlaylists();
  const isSignedIn = authStatus === "authenticated";

  async function handlePickerToggle() {
    // the picker needs youtube oauth, so signed-out users start there first
    if (!isSignedIn) {
      await signIn("google");
      return;
    }

    setIsPickerOpen((currentValue) => !currentValue);

    // only fetch on first open unless the user hits refresh
    if (playlistsStatus === "idle") {
      await loadPlaylists();
    }
  }

  async function handlePlaylistSelect(playlistId: string) {
    // close first so the loaded toast and new grid get the focus
    setIsPickerOpen(false);
    await onPlaylistLoad(playlistId);
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-start gap-4 p-5">
      <PlaylistInput
        areVideoDetailsHidden={areVideoDetailsHidden}
        errorMessage={errorMessage}
        onLoad={onPlaylistLoad}
        onVideoDetailsToggle={onVideoDetailsToggle}
        status={playlistStatus}
      />

      {isPickerOpen ? (
        <button
          aria-label="close playlist picker"
          className="pointer-events-auto fixed inset-0 z-10 cursor-default bg-transparent"
          onPointerDown={() => setIsPickerOpen(false)}
          type="button"
        />
      ) : null}

      <div className="relative z-20">
        <nav className="group pointer-events-auto -m-5 hidden items-center gap-3 p-5 sm:flex">
          <button
            aria-label="pick a youtube playlist"
            className={`toolbar-pan-button playlist-picker-button ${
              isPickerOpen ? "playlist-picker-button-active" : ""
            }`}
            onClick={() => void handlePickerToggle()}
            type="button"
          >
            P
          </button>
          <button className="toolbar-pan-button">U</button>
          <button className="toolbar-pan-button">D</button>
          <button className="toolbar-pan-button">R</button>
        </nav>

        <PlaylistPicker
          errorMessage={playlistsErrorMessage}
          isOpen={isPickerOpen}
          onRefresh={loadPlaylists}
          onSelect={handlePlaylistSelect}
          playlists={playlists}
          status={playlistsStatus}
        />
      </div>

      <div className="pointer-events-auto flex justify-end gap-2">
        {isSignedIn ? (
          <AccountMenu
            email={session.user?.email ?? null}
            imageUrl={session.user?.image ?? null}
            name={session.user?.name ?? null}
          />
        ) : (
          <button
            className="toolbar-button"
            onClick={() => void signIn("google")}
            type="button"
          >
            login
          </button>
        )}
        <button
          aria-label="open settings"
          className="toolbar-icon-button"
          type="button"
        >
          <Settings aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </button>
      </div>

    </header>
  );
}
