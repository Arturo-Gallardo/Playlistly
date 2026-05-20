"use client";

import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { ToolbarPanButton } from "../toolbar/ToolbarPanButton";
import { ToolbarTooltipWrap } from "../toolbar/ToolbarTooltipWrap";

const toolbarIconClassName = "size-4";

type CanvasZoomControlsProps = {
  canFitAll: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onFitAll: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function CanvasZoomControls({
  canFitAll,
  canZoomIn,
  canZoomOut,
  onFitAll,
  onZoomIn,
  onZoomOut,
}: CanvasZoomControlsProps) {
  return (
    <div
      aria-label="Zoom controls"
      className="canvas-zoom-controls flex shrink-0 items-center gap-1.5"
      role="toolbar"
    >
      <ToolbarTooltipWrap label="Zoom out">
        <ToolbarPanButton
          ariaLabel="zoom out"
          disabled={!canZoomOut}
          onClick={onZoomOut}
        >
          <ZoomOut
            aria-hidden="true"
            className={toolbarIconClassName}
            strokeWidth={1.8}
          />
        </ToolbarPanButton>
      </ToolbarTooltipWrap>

      <ToolbarTooltipWrap label="Zoom in">
        <ToolbarPanButton
          ariaLabel="zoom in"
          disabled={!canZoomIn}
          onClick={onZoomIn}
        >
          <ZoomIn
            aria-hidden="true"
            className={toolbarIconClassName}
            strokeWidth={1.8}
          />
        </ToolbarPanButton>
      </ToolbarTooltipWrap>

      <ToolbarTooltipWrap hint="0" label="Fit all tiles">
        <ToolbarPanButton
          ariaLabel="fit all tiles in view"
          disabled={!canFitAll}
          onClick={onFitAll}
        >
          <Maximize2
            aria-hidden="true"
            className={toolbarIconClassName}
            strokeWidth={1.8}
          />
        </ToolbarPanButton>
      </ToolbarTooltipWrap>
    </div>
  );
}
