"use client";

import { useState } from "react";
import { useWelcomeOverlay } from "../../hooks/canvas/useWelcomeOverlay";
import { useAppCanvas } from "../../hooks/canvas/useAppCanvas";
import { AppToolbar } from "../toolbar/AppToolbar";
import { ExportLayoutDialog } from "../toolbar/ExportLayoutDialog";
import { SettingsDialog } from "../toolbar/SettingsDialog";
import { CanvasEmptyState } from "./CanvasEmptyState";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";
import { CanvasOnboardingHints } from "./CanvasOnboardingHints";
import { CanvasShortcutLegend } from "./CanvasShortcutLegend";
import { CanvasOverlays } from "./overlays/CanvasOverlays";
import { WelcomeOverlay } from "./overlays/WelcomeOverlay";
import { CanvasVideoDetailsPanel } from "./viewport/CanvasVideoDetailsPanel";
import { CanvasViewport } from "./viewport/CanvasViewport";
import type { HoveredVideoDetails } from "./VideoGrid";

export function AppCanvas() {
  return (
    <main className="canvas-app-enter relative h-dvh overflow-hidden bg-[#111111] text-white">
      <AppCanvasRoot />
    </main>
  );
}

function AppCanvasRoot() {
  const canvas = useAppCanvas();
  const welcome = useWelcomeOverlay();
  const [stageKey, setStageKey] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <>
      <AppToolbar
        canFitAllTiles={canvas.canFitAllTiles}
        canRedo={canvas.canRedoLayout}
        canSave={canvas.canSave}
        canUndo={canvas.canUndoLayout}
        canZoomIn={canvas.canZoomIn}
        canZoomOut={canvas.canZoomOut}
        errorMessage={canvas.errorMessage}
        hasTilesOnCanvas={canvas.tiles.length > 0}
        onCanvasClear={canvas.clearCanvas}
        onCanvasExport={() => setIsExportDialogOpen(true)}
        onCanvasImport={canvas.handleCanvasImport}
        onCanvasRedo={canvas.handleRedoLayout}
        onCanvasSave={canvas.saveCanvasNow}
        onCanvasUndo={canvas.handleUndoLayout}
        onFitAllTiles={canvas.handleFitAllTiles}
        onFocusVideoTile={canvas.handleFocusVideoTile}
        onPlaylistLoad={canvas.handlePlaylistLoad}
        onPickerOpenChange={canvas.setIsPlaylistPickerOpen}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onZoomIn={canvas.handleZoomIn}
        onZoomOut={canvas.handleZoomOut}
        playlistStatus={canvas.playlistStatus}
        tiles={canvas.tiles}
      />

      <CanvasErrorBoundary onReset={() => setStageKey((current) => current + 1)}>
        <AppCanvasStage
          canvas={canvas}
          isExportDialogOpen={isExportDialogOpen}
          isSettingsOpen={isSettingsOpen}
          key={stageKey}
          onCloseExport={() => setIsExportDialogOpen(false)}
          onCloseSettings={() => setIsSettingsOpen(false)}
          welcome={welcome}
        />
      </CanvasErrorBoundary>
    </>
  );
}

type AppCanvasStageProps = {
  canvas: ReturnType<typeof useAppCanvas>;
  isExportDialogOpen: boolean;
  isSettingsOpen: boolean;
  onCloseExport: () => void;
  onCloseSettings: () => void;
  welcome: ReturnType<typeof useWelcomeOverlay>;
};

function AppCanvasStage({
  canvas,
  isExportDialogOpen,
  isSettingsOpen,
  onCloseExport,
  onCloseSettings,
  welcome,
}: AppCanvasStageProps) {
  const [hoveredVideoDetails, setHoveredVideoDetails] =
    useState<HoveredVideoDetails | null>(null);
  const { pointer } = canvas;

  return (
    <>
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
          onClose={onCloseExport}
          onExport={canvas.handleCanvasExport}
        />
      ) : null}

      {isSettingsOpen ? (
        <SettingsDialog
          areVideoDetailsHidden={canvas.areVideoDetailsHidden}
          isShortcutLegendVisible={canvas.isShortcutLegendVisible}
          onClearPlaylistCache={canvas.handleClearPlaylistCache}
          onClearSavedLayout={canvas.handleClearSavedLayout}
          onClose={onCloseSettings}
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
    </>
  );
}
