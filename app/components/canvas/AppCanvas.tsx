"use client";

import { useState } from "react";
import { useWelcomeOverlay } from "../../hooks/canvas/useWelcomeOverlay";
import { useAppCanvas } from "../../hooks/canvas/useAppCanvas";
import { AppToolbar } from "../toolbar/AppToolbar";
import { ExportLayoutDialog } from "../toolbar/ExportLayoutDialog";
import { SettingsDialog } from "../toolbar/SettingsDialog";
import { CanvasEmptyState } from "./CanvasEmptyState";
import { CanvasOnboardingHints } from "./CanvasOnboardingHints";
import { CanvasShortcutLegend } from "./CanvasShortcutLegend";
import { CanvasOverlays } from "./overlays/CanvasOverlays";
import { WelcomeOverlay } from "./overlays/WelcomeOverlay";
import { CanvasVideoDetailsPanel } from "./viewport/CanvasVideoDetailsPanel";
import { CanvasViewport } from "./viewport/CanvasViewport";
import type { HoveredVideoDetails } from "./VideoGrid";

export function AppCanvas() {
  const [hoveredVideoDetails, setHoveredVideoDetails] =
    useState<HoveredVideoDetails | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const canvas = useAppCanvas();
  const { pointer } = canvas;
  const welcome = useWelcomeOverlay();

  return (
    <main className="canvas-app-enter relative h-dvh overflow-hidden bg-[#111111] text-white">
      <AppToolbar
        canRedo={canvas.canRedoLayout}
        canSave={canvas.canSave}
        canUndo={canvas.canUndoLayout}
        errorMessage={canvas.errorMessage}
        hasTilesOnCanvas={canvas.tiles.length > 0}
        onCanvasClear={canvas.clearCanvas}
        onCanvasExport={() => setIsExportDialogOpen(true)}
        onCanvasImport={canvas.handleCanvasImport}
        onCanvasRedo={canvas.handleRedoLayout}
        onCanvasSave={canvas.saveCanvasNow}
        onCanvasUndo={canvas.handleUndoLayout}
        onPlaylistLoad={canvas.handlePlaylistLoad}
        onPickerOpenChange={canvas.setIsPlaylistPickerOpen}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        playlistStatus={canvas.playlistStatus}
      />

      {canvas.tiles.length === 0 && canvas.playlistStatus !== "loading" ? (
        <>
          <CanvasEmptyState />
          {!welcome.isWelcomeVisible ? (
            <CanvasOnboardingHints
              isPlaylistPickerOpen={canvas.isPlaylistPickerOpen}
              isVisible
            />
          ) : null}
        </>
      ) : null}

      <CanvasViewport
        bounds={canvas.bounds}
        cameraZoom={canvas.camera.zoom}
        dragModeType={pointer.dragMode?.type}
        isTileEnterActive={canvas.isTileEnterActive}
        movingTileIds={pointer.movingTileIds}
        onPointerCancel={pointer.handlePointerCancel}
        onPointerDown={pointer.handlePointerDown}
        onPointerMove={pointer.handlePointerMove}
        onPointerUp={pointer.handlePointerUp}
        onTileContextMenu={pointer.handleTileContextMenu}
        onTileDoubleClick={pointer.handleTileDoubleClick}
        onTilePointerDown={pointer.handleTilePointerDown}
        onVideoHover={setHoveredVideoDetails}
        onVideoHoverEnd={() => setHoveredVideoDetails(null)}
        onViewportContextMenu={pointer.handleViewportContextMenu}
        onWheel={pointer.handleWheel}
        selectionRect={pointer.selectionRect}
        selectedTileIds={canvas.validSelectedTileIds}
        viewportRef={canvas.viewportRef}
        visibleTiles={canvas.visibleTiles}
        worldLayerRef={canvas.worldLayerRef}
      />

      {hoveredVideoDetails && !canvas.areVideoDetailsHidden ? (
        <CanvasVideoDetailsPanel details={hoveredVideoDetails} />
      ) : null}

      {canvas.isShortcutLegendVisible ? (
        <CanvasShortcutLegend
          activeInteraction={pointer.activeCanvasInteraction}
          pointerModifiers={pointer.pointerModifiers}
        />
      ) : null}

      {isExportDialogOpen ? (
        <ExportLayoutDialog
          onClose={() => setIsExportDialogOpen(false)}
          onExport={canvas.handleCanvasExport}
        />
      ) : null}

      {isSettingsOpen ? (
        <SettingsDialog
          areVideoDetailsHidden={canvas.areVideoDetailsHidden}
          isShortcutLegendVisible={canvas.isShortcutLegendVisible}
          onClearPlaylistCache={canvas.handleClearPlaylistCache}
          onClearSavedLayout={canvas.handleClearSavedLayout}
          onClose={() => setIsSettingsOpen(false)}
          onShortcutLegendVisibleChange={canvas.setIsShortcutLegendVisible}
          onVideoDetailsHiddenChange={canvas.setAreVideoDetailsHidden}
        />
      ) : null}

      {welcome.isWelcomeVisible ? (
        <WelcomeOverlay onContinue={welcome.dismissWelcome} />
      ) : null}

      <CanvasOverlays
        closeContextMenu={canvas.closeContextMenu}
        contextMenuState={canvas.contextMenuState}
        handleContextMenuPaste={canvas.handleContextMenuPaste}
        handleCopyTiles={canvas.handleCopyTiles}
        handleDeleteTiles={canvas.handleDeleteTiles}
        handleOrderSelectedTiles={canvas.handleOrderSelectedTiles}
        isSlowPlaylistLoad={canvas.isSlowPlaylistLoad}
        loadNotification={canvas.loadNotification}
        menuCanPaste={canvas.menuCanPaste}
        playlistStatus={canvas.playlistStatus}
      />
    </main>
  );
}
