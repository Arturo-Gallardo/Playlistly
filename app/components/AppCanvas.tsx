"use client";

import Image from "next/image";
import type { PointerEvent, WheelEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useCanvasCamera } from "../hooks/useCanvasCamera";
import { usePlaylistVideos } from "../hooks/usePlaylistVideos";
import type { PlaylistVideo } from "../types/playlist";
import { AppToolbar } from "./AppToolbar";
import { VideoGrid } from "./VideoGrid";

type AppCanvasProps = {
  videos: PlaylistVideo[];
};

type DragState = {
  pointerId: number;
  lastX: number;
  lastY: number;
};

// toolbar controls and video links should not start a pan
function isInteractiveElement(target: EventTarget) {
  return (
    target instanceof Element && Boolean(target.closest("a, button, input"))
  );
}

export function AppCanvas({ videos }: AppCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<PlaylistVideo | null>(null);
  const [loadNotification, setLoadNotification] = useState<string | null>(null);
  const { camera, panBy, zoomAtPoint } = useCanvasCamera();
  const {
    errorMessage,
    loadPlaylist,
    status: playlistStatus,
    videos: playlistVideos,
  } = usePlaylistVideos(videos);

  useEffect(() => {
    return () => {
      // clear the toast timer if the canvas unmounts mid-animation
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  async function handlePlaylistLoad(playlist: string) {
    const didLoad = await loadPlaylist(playlist);

    if (!didLoad) {
      return;
    }

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setLoadNotification("playlist loaded");
    // keep the message around just long enough for the css animation
    notificationTimeoutRef.current = setTimeout(() => {
      setLoadNotification(null);
    }, 1800);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isInteractiveElement(event.target)) {
      return;
    }

    // keep receiving pointer moves even if the cursor moves fast
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    // only the pointer that started the drag can move the camera
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    panBy({
      x: event.clientX - dragState.lastX,
      y: event.clientY - dragState.lastY,
    });

    setDragState({
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragState?.pointerId === event.pointerId) {
      setDragState(null);
    }
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const rect = viewportRef.current?.getBoundingClientRect();
    const zoomDirection = event.deltaY > 0 ? -1 : 1;

    // wheel zooms toward the cursor, like a canvas
    zoomAtPoint(
      {
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
      },
      camera.zoom + zoomDirection * 0.12,
    );
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#111111] text-white">
      <AppToolbar
        errorMessage={errorMessage}
        onPlaylistLoad={handlePlaylistLoad}
        playlistStatus={playlistStatus}
      />

      <div
        className={`absolute inset-0 touch-none select-none bg-[radial-gradient(circle,_rgba(255,255,255,0.16)_1px,_transparent_1px)] [background-size:20px_20px] ${
          dragState ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        ref={viewportRef}
      >
        <div
          className="origin-top-left will-change-transform"
          style={{
            // one transform is the camera: move first, then scale the world
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
          }}
        >
          <VideoGrid
            onVideoHover={setHoveredVideo}
            onVideoHoverEnd={() => setHoveredVideo(null)}
            videos={playlistVideos}
          />
        </div>
      </div>

      {hoveredVideo ? (
        <aside className="pointer-events-none fixed bottom-5 left-5 z-20 flex max-w-2xl gap-4 rounded-md border border-white/15 bg-[#111111]/45 p-3 shadow-2xl backdrop-blur-sm">
          {hoveredVideo.thumbnailUrl ? (
            <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded bg-white/5">
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="144px"
                src={hoveredVideo.thumbnailUrl}
              />
            </div>
          ) : null}

          <div className="min-w-0 self-center">
            {hoveredVideo.channelTitle ? (
              <p className="font-control mb-2 text-[10px] uppercase tracking-[0.24em] text-white/55">
                {hoveredVideo.channelTitle}
              </p>
            ) : null}
            <p className="font-control text-sm font-semibold leading-5 text-white drop-shadow">
              {hoveredVideo.title}
            </p>
          </div>
        </aside>
      ) : null}

      {loadNotification ? (
        <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
          <div className="playlist-loaded-toast rounded-full border border-[#CA3E47]/50 bg-[#111111]/65 px-5 py-3 shadow-2xl backdrop-blur-md">
            <p className="font-control text-xs font-semibold uppercase tracking-[0.28em] text-white">
              {loadNotification}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
