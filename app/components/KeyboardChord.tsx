"use client";

import { Command, Hand, Mouse, MousePointer2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { getIsMacPlatform } from "../lib/keyboard-platform";
import { Kbd } from "./ui/kbd";

export type ChordPart =
  | { type: "mod" }
  | { type: "shift" }
  | { type: "alt" }
  | { type: "key"; label: string }
  | { type: "click" }
  | { type: "doubleClick" }
  | { type: "drag" }
  | { type: "middleClick" }
  | { type: "scroll" };

type KeyboardChordProps = {
  active?: boolean;
  parts: ChordPart[];
};

function ChordSeparator() {
  return (
    <span aria-hidden="true" className="font-control text-[10px] text-white/30">
      +
    </span>
  );
}

function ModKeyCap() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(getIsMacPlatform());
  }, []);

  if (isMac) {
    return (
      <Kbd aria-label="Command" className="px-1">
        <Command aria-hidden="true" className="size-3" strokeWidth={1.8} />
      </Kbd>
    );
  }

  return <Kbd>Ctrl</Kbd>;
}

function ChordPartKey({ part }: { part: ChordPart }) {
  if (part.type === "mod") {
    return <ModKeyCap />;
  }

  if (part.type === "shift") {
    return <Kbd>Shift</Kbd>;
  }

  if (part.type === "alt") {
    return <Kbd>Alt</Kbd>;
  }

  if (part.type === "drag") {
    return (
      <Kbd aria-label="Drag" className="px-1">
        <Hand aria-hidden="true" className="size-3" strokeWidth={1.8} />
      </Kbd>
    );
  }

  if (part.type === "scroll") {
    return (
      <Kbd aria-label="Scroll" className="px-1">
        <Mouse aria-hidden="true" className="size-3" strokeWidth={1.8} />
      </Kbd>
    );
  }

  if (part.type === "middleClick") {
    return (
      <Kbd aria-label="Middle-click" className="px-1.5 text-[9px] tracking-[0.12em]">
        MMB
      </Kbd>
    );
  }

  if (part.type === "doubleClick") {
    return (
      <span className="inline-flex items-center gap-1">
        <Kbd aria-label="Double-click" className="px-1">
          <MousePointer2 aria-hidden="true" className="size-3" strokeWidth={1.8} />
        </Kbd>
        <span aria-hidden="true" className="font-control text-[9px] text-white/35">
          ×2
        </span>
      </span>
    );
  }

  if (part.type === "click") {
    return (
      <Kbd aria-label="Click" className="px-1">
        <MousePointer2 aria-hidden="true" className="size-3" strokeWidth={1.8} />
      </Kbd>
    );
  }

  return <Kbd>{part.label}</Kbd>;
}

export function KeyboardChord({ active = false, parts }: KeyboardChordProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 transition-all duration-150",
        active && "[&_kbd]:border-white/45 [&_kbd]:text-white [&_kbd]:bg-white/10",
      )}
    >
      {parts.map((part, index) => (
        <span className="inline-flex items-center gap-1" key={`${part.type}-${index}`}>
          {index > 0 ? <ChordSeparator /> : null}
          <ChordPartKey part={part} />
        </span>
      ))}
    </span>
  );
}
