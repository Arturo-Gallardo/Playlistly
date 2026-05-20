import type { CanvasSnapshotWire } from "../../types/canvas-snapshot";
import { parseCanvasSnapshotValue } from "./canvas-storage";

export const canvasLayoutFileExtension = ".playlistly.json";

export function getDefaultCanvasExportBasename() {
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date());

  return `playlistly-layout-${formattedDate}`;
}

export function getCanvasExportFilename(basename = getDefaultCanvasExportBasename()) {
  return buildCanvasExportFilename(basename);
}

function sanitizeCanvasExportBasename(name: string) {
  const trimmed = name
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\.+$/, "")
    .slice(0, 120);

  return trimmed.length > 0 ? trimmed : getDefaultCanvasExportBasename();
}

function buildCanvasExportFilename(basename: string) {
  const safeBasename = sanitizeCanvasExportBasename(basename);

  if (
    safeBasename.endsWith(canvasLayoutFileExtension) ||
    safeBasename.endsWith(".json")
  ) {
    return safeBasename;
  }

  return `${safeBasename}${canvasLayoutFileExtension}`;
}

export function parseCanvasSnapshotFile(text: string): CanvasSnapshotWire | null {
  try {
    const parsedValue: unknown = JSON.parse(text);

    return parseCanvasSnapshotValue(parsedValue);
  } catch {
    return null;
  }
}

export function downloadCanvasSnapshotFile(
  snapshot: CanvasSnapshotWire,
  basename?: string,
) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = getCanvasExportFilename(basename);
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
