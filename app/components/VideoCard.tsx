import Image from "next/image";
import type { PlaylistVideo } from "../types/playlist";

type VideoCardProps = {
  video: PlaylistVideo;
  index: number;
  onHover: (video: PlaylistVideo) => void;
  onHoverEnd: () => void;
};

export function VideoCard({
  video,
  index,
  onHover,
  onHoverEnd,
}: VideoCardProps) {
  return (
    <a
      className="group relative block aspect-video overflow-hidden rounded-md border border-white/90 bg-transparent transition hover:border-[#CA3E47] hover:bg-[#525252]"
      href={video.url}
      aria-label={`open ${video.title} on youtube`}
      onBlur={onHoverEnd}
      onFocus={() => onHover(video)}
      onMouseEnter={() => onHover(video)}
      onMouseLeave={onHoverEnd}
      rel="noreferrer"
      target="_blank"
    >
      {video.thumbnailUrl ? (
        <Image
          alt=""
          className="absolute inset-0 size-full object-cover opacity-85 transition group-hover:opacity-45"
          fill
          sizes="132px"
          src={video.thumbnailUrl}
        />
      ) : null}
      <span className="absolute inset-0 bg-black/15 transition group-hover:bg-black/35" />

      <span className="font-control absolute left-2 top-2 text-[10px] font-semibold text-white/55 transition group-hover:text-white">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="absolute inset-x-2 bottom-2 translate-y-1 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
        <h3 className="font-control line-clamp-2 text-[11px] font-semibold leading-4 text-white">
          {video.title}
        </h3>
        {video.channelTitle ? (
          <p className="mt-1 truncate text-[10px] text-white/65">
            {video.channelTitle}
          </p>
        ) : null}
      </div>
    </a>
  );
}
