"use client";

import { Settings } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { PlaylistLoadStatus } from "../hooks/usePlaylistVideos";
import { useYouTubePlaylists } from "../hooks/useYouTubePlaylists";
import { AccountMenu } from "./AccountMenu";
import { PlaylistInput } from "./PlaylistInput";
import { PlaylistPicker } from "./PlaylistPicker";
import { ToolbarPanButton } from "./ToolbarPanButton";
import { ToolbarPressButton } from "./ToolbarPressButton";
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
  onPickerOpenChange: (isOpen: boolean) => void;
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
  onPickerOpenChange,
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

  useEffect(() => {
    onPickerOpenChange(isPickerOpen);
  }, [isPickerOpen, onPickerOpenChange]);

  useEffect(() => {
    if (!isPickerOpen) {
      return;
    }

    function isInsidePicker(target: EventTarget | null) {
      return (
        target instanceof Element &&
        (target.closest(".playlist-picker-panel") !== null ||
          target.closest('[data-onboarding-target="playlist-picker"]') !== null)
      );
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.button === 2 || isInsidePicker(event.target)) {
        return;
      }

      setIsPickerOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPickerOpen(false);
      }
    }

    const listenerFrame = window.requestAnimationFrame(() => {
      window.addEventListener("pointerdown", handlePointerDown, true);
      window.addEventListener("keydown", handleKeyDown);
    });

    return () => {
      window.cancelAnimationFrame(listenerFrame);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPickerOpen]);

  return (
    <header className="canvas-toolbar-enter pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-start gap-4 overflow-visible p-5">
      <PlaylistInput
        areVideoDetailsHidden={areVideoDetailsHidden}
        errorMessage={errorMessage}
        hasTilesOnCanvas={hasTilesOnCanvas}
        onLoad={onPlaylistLoad}
        onVideoDetailsToggle={onVideoDetailsToggle}
        status={playlistStatus}
      />

      <div className="relative z-20">
        <nav className="group pointer-events-auto -m-5 hidden items-center gap-3 p-5 sm:flex">
          <ToolbarTooltipWrap
            hint={isSignedIn ? undefined : "Sign in first"}
            label={isSignedIn ? "Pick playlist" : "Log in to pick"}
          >
            <ToolbarPanButton
              active={isPickerOpen}
              ariaLabel="pick a youtube playlist"
              dataOnboardingTarget="playlist-picker"
              onClick={() => void handlePickerToggle()}
            >
              P
            </ToolbarPanButton>
          </ToolbarTooltipWrap>
          <ToolbarTooltipWrap
            hint={canSave ? "Ctrl+S" : "Load a playlist first"}
            label="Save layout"
          >
            <ToolbarPanButton
              ariaLabel="save canvas layout"
              className="disabled:cursor-not-allowed disabled:opacity-35"
              disabled={!canSave}
              onClick={onCanvasSave}
            >
              S
            </ToolbarPanButton>
          </ToolbarTooltipWrap>
          <ToolbarTooltipWrap hint="Ctrl+K" label="Clear layout">
            <ToolbarPanButton
              ariaLabel="clear saved canvas layout"
              onClick={onCanvasClear}
            >
              C
            </ToolbarPanButton>
          </ToolbarTooltipWrap>
          <ToolbarTooltipWrap hint="Ctrl+Z" label="Undo">
            <ToolbarPanButton
              ariaLabel="undo tile move"
              disabled={!canUndo}
              onClick={onCanvasUndo}
            >
              U
            </ToolbarPanButton>
          </ToolbarTooltipWrap>
          <ToolbarTooltipWrap hint="Ctrl+Y" label="Redo">
            <ToolbarPanButton
              ariaLabel="redo tile move"
              disabled={!canRedo}
              onClick={onCanvasRedo}
            >
              R
            </ToolbarPanButton>
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
          <ToolbarPressButton aria-label="open settings" variant="icon">
            <Settings aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </ToolbarPressButton>
        </ToolbarTooltipWrap>
      </div>
    </header>
  );
}
