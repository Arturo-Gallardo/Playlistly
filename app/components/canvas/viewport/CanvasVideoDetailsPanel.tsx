"use client";

import Image from "next/image";
import type { HoveredVideoDetails } from "../VideoGrid";

type CanvasVideoDetailsPanelProps = {
  details: HoveredVideoDetails;
};

export function CanvasVideoDetailsPanel({ details }: CanvasVideoDetailsPanelProps) {
  return (
    <aside className="pointer-events-none fixed bottom-5 left-5 z-20 flex max-w-2xl gap-4 rounded-md border border-white/15 bg-[#111111]/45 p-3 shadow-2xl backdrop-blur-sm">
      <span className="font-control absolute right-3 top-3 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/60">
        {String(details.index + 1).padStart(2, "0")}
      </span>

      {details.video.thumbnailUrl ? (
        <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded bg-white/5">
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="144px"
            src={details.video.thumbnailUrl}
          />
        </div>
      ) : null}

      <div className="min-w-0 self-center pr-10">
        {details.video.channelTitle ? (
          <p className="font-control mb-2 text-[10px] uppercase tracking-[0.24em] text-white/55">
            {details.video.channelTitle}
          </p>
        ) : null}
        <p className="font-control text-sm font-semibold leading-5 text-white drop-shadow">
          {details.video.title}
        </p>
        <p className="font-control mt-2 text-[10px] uppercase tracking-[0.24em] text-white/45">
          double-click thumbnail to open
        </p>
      </div>
    </aside>
  );
}
