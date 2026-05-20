"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { PlaylistLoadStatus } from "../../hooks/playlist/usePlaylistVideos";
import { canvasLayoutFileExtension } from "../../lib/canvas/canvas-import-export";
import { ToolbarPressButton } from "./ToolbarPressButton";
import { ToolbarTooltipWrap } from "./ToolbarTooltipWrap";

type PlaylistInputProps = {
  errorMessage: string | null;
  hasTilesOnCanvas: boolean;
  onCanvasExport: () => void;
  onCanvasImport: (file: File) => Promise<void>;
  onLoad: (playlist: string) => Promise<void>;
  status: PlaylistLoadStatus;
};

export function PlaylistInput({
  errorMessage,
  hasTilesOnCanvas,
  onCanvasExport,
  onCanvasImport,
  onLoad,
  status,
}: PlaylistInputProps) {
  const [playlist, setPlaylist] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);
  const isLoading = status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!playlist.trim() || isLoading) {
      return;
    }

    await onLoad(playlist);
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await onCanvasImport(file);
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
      <ToolbarTooltipWrap label="Export layout">
        <ToolbarPressButton
          disabled={!hasTilesOnCanvas}
          onClick={onCanvasExport}
          variant="pill"
        >
          export
        </ToolbarPressButton>
      </ToolbarTooltipWrap>
      <ToolbarTooltipWrap label="Import layout">
        <ToolbarPressButton onClick={handleImportClick} variant="pill">
          import
        </ToolbarPressButton>
      </ToolbarTooltipWrap>
      <input
        accept={`application/json,${canvasLayoutFileExtension},.json`}
        className="sr-only"
        onChange={(event) => {
          void handleImportFileChange(event);
        }}
        ref={importInputRef}
        type="file"
      />
    </form>
  );
}
