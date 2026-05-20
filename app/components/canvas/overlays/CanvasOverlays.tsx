"use client";

import { CanvasContextMenu } from "../CanvasContextMenu";
import type { PlaylistLoadStatus } from "../../../hooks/playlist/usePlaylistVideos";
import type { ContextMenuState, ToastNotice } from "../../../types/canvas-interaction";

type CanvasOverlaysProps = {
  closeContextMenu: () => void;
  contextMenuState: ContextMenuState | null;
  handleContextMenuPaste: () => Promise<boolean>;
  handleCopyTiles: () => boolean;
  handleDeleteTiles: () => boolean;
  isSlowPlaylistLoad: boolean;
  loadNotification: ToastNotice | null;
  menuCanPaste: boolean;
  playlistStatus: PlaylistLoadStatus;
};

export function CanvasOverlays({
  closeContextMenu,
  contextMenuState,
  handleContextMenuPaste,
  handleCopyTiles,
  handleDeleteTiles,
  isSlowPlaylistLoad,
  loadNotification,
  menuCanPaste,
  playlistStatus,
}: CanvasOverlaysProps) {
  return (
    <>
      {playlistStatus === "loading" && isSlowPlaylistLoad ? (
        <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
          <div className="w-72 rounded-2xl border border-white/15 bg-[#111111]/70 p-4 shadow-2xl backdrop-blur-md">
            <p className="font-control mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-white/65">
              loading playlist
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="playlist-request-loading-bar h-full rounded-full" />
            </div>
          </div>
        </div>
      ) : null}

      {contextMenuState ? (
        <CanvasContextMenu
          canCopy={contextMenuState.replaceTileIds.length > 0}
          canDelete={contextMenuState.replaceTileIds.length > 0}
          canPaste={menuCanPaste}
          clientX={contextMenuState.clientX}
          clientY={contextMenuState.clientY}
          onClose={closeContextMenu}
          onCopy={handleCopyTiles}
          onDelete={handleDeleteTiles}
          onPaste={() => {
            void handleContextMenuPaste();
          }}
        />
      ) : null}

      {loadNotification ? (
        <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
          <div
            key={loadNotification.id}
            className="playlist-loaded-toast rounded-full border border-[#CA3E47]/50 bg-[#111111]/65 px-5 py-3 shadow-2xl backdrop-blur-md"
          >
            <p className="font-control text-xs font-semibold uppercase tracking-[0.28em] text-white">
              {loadNotification.message}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
