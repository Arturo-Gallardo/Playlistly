"use client";

import { Settings } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import type { PlaylistLoadStatus } from "../hooks/usePlaylistVideos";
import { useYouTubePlaylists } from "../hooks/useYouTubePlaylists";
import { AccountMenu } from "./AccountMenu";
import { PlaylistInput } from "./PlaylistInput";
import { PlaylistPicker } from "./PlaylistPicker";
import { ToolbarTooltipWrap } from "./ToolbarTooltipWrap";

type AppToolbarProps = {
  areVideoDetailsHidden: boolean;
  canRedo: boolean;
  canSave: boolean;
  canUndo: boolean;
  errorMessage: string | null;
  hasTilesOnCanvas: boolean;
  onCanvasClear: () => void;
  onCanvasRedo: () => void;
  onCanvasSave: () => void;
  onCanvasUndo: () => void;
  onPlaylistLoad: (playlist: string) => Promise<void>;
  onVideoDetailsToggle: () => void;
  playlistStatus: PlaylistLoadStatus;
};

export function AppToolbar({
  areVideoDetailsHidden,
  canRedo,
  canSave,
  canUndo,
  errorMessage,
  hasTilesOnCanvas,
  onCanvasClear,
  onCanvasRedo,
  onCanvasSave,
  onCanvasUndo,
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
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-start gap-4 overflow-visible p-5">
      <PlaylistInput
        areVideoDetailsHidden={areVideoDetailsHidden}
        errorMessage={errorMessage}
        hasTilesOnCanvas={hasTilesOnCanvas}
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
          <ToolbarTooltipWrap
            hint={isSignedIn ? undefined : "Sign in first"}
            label={isSignedIn ? "Pick playlist" : "Log in to pick"}
          >
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
          </ToolbarTooltipWrap>
          <ToolbarTooltipWrap
            hint={canSave ? "Ctrl+S" : "Load a playlist first"}
            label="Save layout"
          >
            <button
              aria-label="save canvas layout"
              className="toolbar-pan-button disabled:cursor-not-allowed disabled:opacity-35"
              disabled={!canSave}
              onClick={onCanvasSave}
              type="button"
            >
              S
            </button>
          </ToolbarTooltipWrap>
          <ToolbarTooltipWrap hint="Ctrl+K" label="Clear layout">
            <button
              aria-label="clear saved canvas layout"
              className="toolbar-pan-button"
              onClick={onCanvasClear}
              type="button"
            >
              C
            </button>
          </ToolbarTooltipWrap>
          <ToolbarTooltipWrap hint="Ctrl+Z" label="Undo">
            <button
              aria-label="undo tile move"
              className="toolbar-pan-button disabled:cursor-not-allowed disabled:opacity-35"
              disabled={!canUndo}
              onClick={onCanvasUndo}
              type="button"
            >
              U
            </button>
          </ToolbarTooltipWrap>
          <ToolbarTooltipWrap hint="Ctrl+Y" label="Redo">
            <button
              aria-label="redo tile move"
              className="toolbar-pan-button disabled:cursor-not-allowed disabled:opacity-35"
              disabled={!canRedo}
              onClick={onCanvasRedo}
              type="button"
            >
              R
            </button>
          </ToolbarTooltipWrap>
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
          <ToolbarTooltipWrap label="Log in with Google">
            <button
              className="toolbar-button"
              onClick={() => void signIn("google")}
              type="button"
            >
              login
            </button>
          </ToolbarTooltipWrap>
        )}
        <ToolbarTooltipWrap label="Settings">
          <button
            aria-label="open settings"
            className="toolbar-icon-button"
            type="button"
          >
            <Settings aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </button>
        </ToolbarTooltipWrap>
      </div>
    </header>
  );
}
