"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  canvasLayoutFileExtension,
  getDefaultCanvasExportBasename,
} from "../../lib/canvas/canvas-import-export";

type ExportLayoutDialogProps = {
  defaultBasename?: string;
  onClose: () => void;
  onExport: (basename: string) => void;
};

export function ExportLayoutDialog({
  defaultBasename = getDefaultCanvasExportBasename(),
  onClose,
  onExport,
}: ExportLayoutDialogProps) {
  const dialogTitleId = useId();
  const filenameInputId = useId();
  const filenameInputRef = useRef<HTMLInputElement>(null);
  const [basename, setBasename] = useState(defaultBasename);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const input = filenameInputRef.current;

    if (!input) {
      return;
    }

    input.focus();
    input.select();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onExport(basename);
    onClose();
  }

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <>
      <button
        aria-label="close export dialog"
        className="fixed inset-0 z-[110] cursor-default bg-black/55"
        onClick={onClose}
        type="button"
      />
      <div className="pointer-events-none fixed inset-0 z-[111] grid place-items-center p-4">
        <form
          aria-labelledby={dialogTitleId}
          aria-modal="true"
          className="export-layout-dialog pointer-events-auto font-control flex w-full max-w-md flex-col gap-4 rounded-xl border border-white/15 bg-[#111111]/95 p-4 shadow-[0_18px_48px_rgb(0_0_0/0.55)] backdrop-blur-md sm:p-5"
          onPointerDown={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
          role="dialog"
        >
          <header className="space-y-1">
            <h2
              className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75"
              id={dialogTitleId}
            >
              export layout
            </h2>
            <p className="text-[11px] text-white/50">
              choose a filename for your canvas layout.
            </p>
          </header>

          <div className="space-y-2">
            <label
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45"
              htmlFor={filenameInputId}
            >
              filename
            </label>
            <div className="flex min-w-0 items-center gap-2">
              <input
                className="toolbar-input min-w-0 flex-1"
                id={filenameInputId}
                onChange={(event) => setBasename(event.target.value)}
                placeholder={getDefaultCanvasExportBasename()}
                ref={filenameInputRef}
                type="text"
                value={basename}
              />
              <span className="shrink-0 text-[11px] text-white/40">
                {canvasLayoutFileExtension}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="toolbar-button px-4"
              onClick={onClose}
              type="button"
            >
              cancel
            </button>
            <button className="toolbar-button px-4" type="submit">
              export
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}
