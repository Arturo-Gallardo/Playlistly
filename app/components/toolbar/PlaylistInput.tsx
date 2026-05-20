"use client";

import { Download, Loader2, Search, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { PlaylistLoadStatus } from "../../hooks/playlist/usePlaylistVideos";
import { canvasLayoutFileExtension } from "../../lib/canvas/canvas-import-export";
import { ToolbarPressButton } from "./ToolbarPressButton";
import { ToolbarTooltipWrap } from "./ToolbarTooltipWrap";

const toolbarIconClassName = "size-4";

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
        <ToolbarPressButton
          aria-label="load playlist"
          disabled={isLoading}
          type="submit"
          variant="icon"
        >
          {isLoading ? (
            <Loader2
              aria-hidden="true"
              className={`${toolbarIconClassName} animate-spin`}
              strokeWidth={1.8}
            />
          ) : (
            <Search
              aria-hidden="true"
              className={toolbarIconClassName}
              strokeWidth={1.8}
            />
          )}
        </ToolbarPressButton>
      </ToolbarTooltipWrap>
      <ToolbarTooltipWrap label="Export layout">
        <ToolbarPressButton
          aria-label="export layout"
          disabled={!hasTilesOnCanvas}
          onClick={onCanvasExport}
          variant="icon"
        >
          <Upload
            aria-hidden="true"
            className={toolbarIconClassName}
            strokeWidth={1.8}
          />
        </ToolbarPressButton>
      </ToolbarTooltipWrap>
      <ToolbarTooltipWrap label="Import layout">
        <ToolbarPressButton
          aria-label="import layout"
          onClick={handleImportClick}
          variant="icon"
        >
          <Download
            aria-hidden="true"
            className={toolbarIconClassName}
            strokeWidth={1.8}
          />
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
