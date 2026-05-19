import type { PointerEvent } from "react";
import { memo, useState } from "react";
import { getYouTubeVideoThumbnails } from "../lib/youtube-thumbnails";
import type { PlaylistVideo } from "../types/playlist";

export type ThumbnailSize = "16px" | "32px" | "64px" | "132px";

type VideoCardProps = {
  index: number;
  isMoving: boolean;
  isSelected: boolean;
  onDoubleClick: () => void;
  onHover: (video: PlaylistVideo) => void;
  onHoverEnd: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  thumbnailSize: ThumbnailSize;
  video: PlaylistVideo;
};

export const VideoCard = memo(function VideoCard({
  index,
  isMoving,
  isSelected,
  onDoubleClick,
  onHover,
  onHoverEnd,
  onPointerDown,
  thumbnailSize,
  video,
}: VideoCardProps) {
  const thumbnailUrl = getThumbnailUrlForSize(video, thumbnailSize);
  const [loadedThumbnailUrl, setLoadedThumbnailUrl] = useState<string | null>(
    null,
  );
  const isThumbnailLoaded =
    thumbnailUrl !== null && loadedThumbnailUrl === thumbnailUrl;

  return (
    <div
      className={getVideoCardClassName({
        isMoving,
        isSelected,
      })}
      data-tile-card="true"
      aria-label={`open ${video.title} on youtube`}
      onBlur={onHoverEnd}
      onFocus={() => onHover(video)}
      onMouseEnter={() => onHover(video)}
      onMouseLeave={onHoverEnd}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      role="group"
      tabIndex={0}
    >
      <span className="absolute inset-0 bg-white/[0.08]" />
      {thumbnailUrl ? (
        // canvas tiles load straight from youtube cdn to skip next/image overhead
        <img
          alt=""
          className={`absolute inset-0 size-full object-cover transition duration-200 group-hover:scale-105 group-hover:opacity-65 ${
            isThumbnailLoaded ? "opacity-85" : "opacity-0"
          }`}
          decoding="async"
          loading="lazy"
          onLoad={() => setLoadedThumbnailUrl(thumbnailUrl)}
          src={thumbnailUrl}
        />
      ) : null}
      <span className={getOverlayClassName(isThumbnailLoaded)} />
      {isSelected ? (
        <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-[#CA3E47] ring-offset-2 ring-offset-[#111111]" />
      ) : null}

      <span className="font-control absolute left-2 top-2 text-[10px] font-semibold text-white/55 transition group-hover:text-white">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}, areVideoCardPropsEqual);

function areVideoCardPropsEqual(
  currentProps: VideoCardProps,
  nextProps: VideoCardProps,
) {
  return (
    currentProps.index === nextProps.index &&
    currentProps.isMoving === nextProps.isMoving &&
    currentProps.isSelected === nextProps.isSelected &&
    currentProps.thumbnailSize === nextProps.thumbnailSize &&
    currentProps.video === nextProps.video
  );
}

function getVideoCardClassName({
  isMoving,
  isSelected,
}: {
  isMoving: boolean;
  isSelected: boolean;
}) {
  const borderColor = isSelected ? "border-[#CA3E47]" : "border-white/90";
  const cursor = isMoving ? "cursor-grabbing" : "cursor-grab";

  return `group relative block size-full overflow-hidden rounded-md border bg-transparent transition hover:border-[#CA3E47] hover:bg-[#525252] ${borderColor} ${cursor}`;
}

function getOverlayClassName(isThumbnailLoaded: boolean) {
  if (!isThumbnailLoaded) {
    return "absolute inset-0 bg-white/[0.04] transition";
  }

  return "absolute inset-0 bg-black/15 transition group-hover:bg-[#CA3E47]/20";
}

function getThumbnailUrlForSize(video: PlaylistVideo, thumbnailSize: ThumbnailSize) {
  const derivedThumbnails = getYouTubeVideoThumbnails(video.id);
  const thumbnails = {
    default:
      video.thumbnailUrls.default ?? derivedThumbnails.default,
    medium: video.thumbnailUrls.medium ?? derivedThumbnails.medium,
    high: video.thumbnailUrls.high ?? derivedThumbnails.high,
  };

  if (thumbnailSize === "16px" || thumbnailSize === "32px") {
    return (
      thumbnails.default ??
      thumbnails.medium ??
      thumbnails.high ??
      video.thumbnailUrl
    );
  }

  if (thumbnailSize === "64px") {
    return (
      thumbnails.medium ??
      thumbnails.default ??
      thumbnails.high ??
      video.thumbnailUrl
    );
  }

  return (
    thumbnails.high ??
    thumbnails.medium ??
    thumbnails.default ??
    video.thumbnailUrl
  );
}
