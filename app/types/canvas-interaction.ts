import type { Point } from "../lib/canvas/canvas-layout";

export type ToastNotice = {
  id: number;
  message: string;
};

export type ContextMenuState = {
  clientX: number;
  clientY: number;
  replaceTileIds: string[];
  worldPoint: Point;
};

export type DragMode =
  | {
      type: "pan";
      pointerId: number;
    }
  | {
      type: "moveTiles";
      pointerId: number;
      tileIds: Set<string>;
      grabOffsets: Map<string, Point>;
    }
  | {
      type: "pendingTile";
      pointerId: number;
      tileIds: Set<string>;
      startScreenPoint: Point;
    }
  | {
      type: "selectBox";
      pointerId: number;
      baseSelection: Set<string>;
      isAdditive: boolean;
      startWorldPoint: Point;
      currentWorldPoint: Point;
    };

export type TileClickRecord = {
  screenPoint: Point;
  tileId: string;
  time: number;
};
