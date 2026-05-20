"use client";

import { useActiveModifiers } from "../../hooks/canvas/useActiveModifiers";
import { cn } from "../../lib/cn";
import { KeyboardChord, type ChordPart } from "../shared/KeyboardChord";

export type CanvasInteraction = "moveTiles" | "pan" | null;

type ShortcutRow = {
  activeWhen?: "shift";
  activeWhenAlt?: boolean;
  activeWhenInteraction?: "moveTiles" | "pan";
  activeWhenKeys?: string[];
  activeWhenModClick?: boolean;
  activeWhenModKey?: string;
  id: string;
  label: string;
  parts: ChordPart[];
};

const canvasShortcuts: ShortcutRow[] = [
  {
    id: "pan",
    label: "Pan canvas",
    activeWhenInteraction: "pan",
    parts: [{ type: "middleClick" }],
  },
  {
    id: "pan-alt",
    label: "Pan canvas",
    activeWhenAlt: true,
    activeWhenInteraction: "pan",
    parts: [{ type: "alt" }, { type: "drag" }],
  },
  {
    id: "snap",
    label: "Snap while dragging",
    activeWhen: "shift",
    activeWhenInteraction: "moveTiles",
    parts: [{ type: "shift" }, { type: "drag" }],
  },
  {
    id: "add-select",
    label: "Add to selection",
    activeWhenModClick: true,
    parts: [{ type: "mod" }, { type: "click" }],
  },
  {
    id: "copy",
    label: "Copy and clear selection",
    activeWhenModKey: "KeyC",
    parts: [{ type: "mod" }, { type: "key", label: "C" }],
  },
  {
    id: "paste",
    label: "Paste tiles",
    activeWhenModKey: "KeyV",
    parts: [{ type: "mod" }, { type: "key", label: "V" }],
  },
  {
    id: "delete",
    label: "Delete tiles",
    activeWhenKeys: ["Backspace", "Delete"],
    parts: [{ type: "key", label: "⌫" }],
  },
  {
    id: "open",
    label: "Open video",
    parts: [{ type: "doubleClick" }],
  },
];

function isRowActive(
  row: ShortcutRow,
  modifiers: { alt: boolean; mod: boolean; shift: boolean },
  pressedKeys: ReadonlySet<string>,
  primaryPointerDown: boolean,
  activeInteraction: CanvasInteraction,
) {
  if (row.activeWhenModKey) {
    return modifiers.mod && pressedKeys.has(row.activeWhenModKey);
  }

  if (row.activeWhenModClick) {
    return modifiers.mod && primaryPointerDown;
  }

  if (row.activeWhenKeys) {
    return row.activeWhenKeys.some((keyCode) => pressedKeys.has(keyCode));
  }

  if (row.activeWhen === "shift" && modifiers.shift) {
    return true;
  }

  if (
    row.activeWhenInteraction &&
    row.activeWhenInteraction === activeInteraction
  ) {
    if (row.activeWhenAlt) {
      return modifiers.alt;
    }

    return !modifiers.alt;
  }

  return false;
}

type CanvasShortcutLegendProps = {
  activeInteraction?: CanvasInteraction;
  pointerModifiers?: {
    alt: boolean;
    mod: boolean;
    primaryDown: boolean;
    shift: boolean;
  };
};

export function CanvasShortcutLegend({
  activeInteraction = null,
  pointerModifiers,
}: CanvasShortcutLegendProps) {
  const keyboardState = useActiveModifiers();
  const modifiers = {
    alt: keyboardState.alt || Boolean(pointerModifiers?.alt),
    shift: keyboardState.shift || Boolean(pointerModifiers?.shift),
    mod: keyboardState.mod || Boolean(pointerModifiers?.mod),
  };
  const pressedKeys = keyboardState.keys;
  const primaryPointerDown = Boolean(pointerModifiers?.primaryDown);

  return (
    <aside
      aria-label="Canvas controls"
      className="pointer-events-none fixed bottom-5 right-5 z-20 max-w-[15rem] rounded-md border border-white/12 bg-[#111111]/50 px-3 py-2.5 shadow-2xl backdrop-blur-sm"
    >
      <p className="font-control mb-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/40">
        Canvas
      </p>
      <ul className="flex flex-col gap-1.5">
        {canvasShortcuts.map((row) => {
          const active = isRowActive(
            row,
            modifiers,
            pressedKeys,
            primaryPointerDown,
            activeInteraction,
          );

          return (
            <li
              className={cn(
                "flex items-center justify-between gap-3 transition-colors duration-150",
                active ? "text-white/90" : "text-white/50",
              )}
              key={row.id}
            >
              <span className="font-control text-[10px] leading-tight">{row.label}</span>
              <KeyboardChord active={active} parts={row.parts} />
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
