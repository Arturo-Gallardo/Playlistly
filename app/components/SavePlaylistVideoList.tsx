"use client";

import { GripVertical } from "lucide-react";
import { useState, type DragEvent } from "react";
import { cn } from "../lib/cn";
import type { PlaylistVideo } from "../types/playlist";

type SavePlaylistVideoListProps = {
  items: PlaylistVideo[];
  onReorder: (fromIndex: number, toIndex: number) => void;
};

export function SavePlaylistVideoList({
  items,
  onReorder,
}: SavePlaylistVideoListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  function handleDragStart(index: number) {
    setDraggedIndex(index);
    setDropTargetIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();

    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    setDropTargetIndex(index);
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();

    if (draggedIndex === null) {
      return;
    }

    onReorder(draggedIndex, index);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }

  return (
    <ol className="save-playlist-video-list max-h-56 space-y-1.5 overflow-y-auto pr-1">
      {items.map((video, index) => {
        const isDragging = draggedIndex === index;
        const isDropTarget =
          dropTargetIndex === index &&
          draggedIndex !== null &&
          draggedIndex !== index;

        return (
          <li
            className={cn(
              "flex items-center gap-2 rounded-md border bg-white/[0.03] p-2 transition-colors",
              isDragging && "border-[#CA3E47]/50 opacity-50",
              isDropTarget
                ? "border-[#CA3E47] bg-[#CA3E47]/10"
                : "border-white/10",
            )}
            draggable
            key={`${video.id}-${index}`}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => handleDragOver(event, index)}
            onDragStart={() => handleDragStart(index)}
            onDrop={(event) => handleDrop(event, index)}
          >
            <span
              aria-hidden
              className="save-playlist-drag-handle shrink-0 cursor-grab text-white/40"
            >
              <GripVertical size={16} />
            </span>
            <span className="font-control w-6 shrink-0 text-center text-[10px] font-semibold text-white/45">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="relative block aspect-video w-16 shrink-0 overflow-hidden rounded bg-white/5">
              {video.thumbnailUrl ? (
                <img
                  alt=""
                  className="size-full object-cover"
                  decoding="async"
                  draggable={false}
                  src={video.thumbnailUrl}
                />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-control line-clamp-2 block text-[11px] font-semibold text-white">
                {video.title}
              </span>
              {video.channelTitle ? (
                <span className="mt-0.5 block truncate text-[10px] text-white/50">
                  {video.channelTitle}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
