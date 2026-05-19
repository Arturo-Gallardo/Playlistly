"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

type CanvasContextMenuProps = {
  canCopy: boolean;
  canPaste: boolean;
  clientX: number;
  clientY: number;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
};

type MenuPosition = {
  left: number;
  top: number;
};

const menuItemClassName =
  "font-control flex w-full cursor-default items-center justify-between gap-3 rounded-md border-0 bg-transparent px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/30 disabled:hover:bg-transparent";

export function CanvasContextMenu({
  canCopy,
  canPaste,
  clientX,
  clientY,
  onClose,
  onCopy,
  onPaste,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [isMounted, setIsMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    left: clientX,
    top: clientY,
  });

  onCloseRef.current = onClose;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    const menuElement = menuRef.current;

    if (!menuElement) {
      return;
    }

    const menuRect = menuElement.getBoundingClientRect();
    const padding = 8;
    const maxLeft = Math.max(
      padding,
      window.innerWidth - menuRect.width - padding,
    );
    const maxTop = Math.max(
      padding,
      window.innerHeight - menuRect.height - padding,
    );

    setMenuPosition({
      left: Math.min(Math.max(clientX, padding), maxLeft),
      top: Math.min(Math.max(clientY, padding), maxTop),
    });
  }, [clientX, clientY]);

  useEffect(() => {
    function isInsideMenu(target: EventTarget | null) {
      return (
        menuRef.current !== null &&
        target instanceof Node &&
        menuRef.current.contains(target)
      );
    }

    function dismissIfOutside(event: Event) {
      if (isInsideMenu(event.target)) {
        return;
      }

      onCloseRef.current();
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.button === 2) {
        return;
      }

      dismissIfOutside(event);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    // defer so the opening right-click does not dismiss the menu immediately
    const listenerFrame = window.requestAnimationFrame(() => {
      window.addEventListener("pointerdown", handlePointerDown, true);
      window.addEventListener("keydown", handleKeyDown);
    });

    return () => {
      window.cancelAnimationFrame(listenerFrame);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-auto fixed z-[100] grid min-w-[10rem] gap-0.5 rounded-lg border border-white/15 bg-[#111111]/95 p-1 shadow-[0_12px_28px_rgb(0_0_0/0.45)] backdrop-blur-md"
      onContextMenu={(event) => event.preventDefault()}
      ref={menuRef}
      role="menu"
      style={{
        left: `${menuPosition.left}px`,
        top: `${menuPosition.top}px`,
      }}
    >
      <button
        className={cn(menuItemClassName, !canCopy && "text-white/30")}
        disabled={!canCopy}
        onClick={() => {
          onCopy();
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        <span>Copy</span>
      </button>
      <button
        className={cn(menuItemClassName, !canPaste && "text-white/30")}
        disabled={!canPaste}
        onClick={(event) => {
          event.stopPropagation();
          onPaste();
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        <span>Paste</span>
      </button>
    </div>,
    document.body,
  );
}
