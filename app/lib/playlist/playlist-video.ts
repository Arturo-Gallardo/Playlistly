import {
  getYouTubePreviewThumbnailUrl,
  getYouTubeVideoThumbnails,
} from "../youtube/youtube-thumbnails";
import type { CanvasVideoWire } from "../../types/canvas-snapshot";
import type { PlaylistVideo, PlaylistVideoWire } from "../../types/playlist";

export function hydratePlaylistVideo(wire: PlaylistVideoWire): PlaylistVideo {
  const thumbnailUrls = getYouTubeVideoThumbnails(wire.id);

  return {
    id: wire.id,
    title: wire.title,
    url: wire.url,
    channelTitle: wire.channelTitle,
    publishedAt: wire.publishedAt,
    thumbnailUrl: getYouTubePreviewThumbnailUrl(wire.id),
    thumbnailUrls,
  };
}

export function hydratePlaylistVideos(
  wires: PlaylistVideoWire[],
): PlaylistVideo[] {
  return wires.map(hydratePlaylistVideo);
}

export function hydrateCanvasVideo(wire: CanvasVideoWire): PlaylistVideo {
  return hydratePlaylistVideo(wire);
}

export function hydrateCanvasVideos(wires: CanvasVideoWire[]): PlaylistVideo[] {
  return wires.map(hydrateCanvasVideo);
}

export function toPlaylistVideoWire(video: PlaylistVideo): PlaylistVideoWire {
  return {
    id: video.id,
    title: video.title,
    url: video.url,
    channelTitle: video.channelTitle,
    publishedAt: video.publishedAt,
  };
}

export function toCanvasVideoWire(
  tileId: string,
  video: PlaylistVideo,
): CanvasVideoWire {
  return {
    tileId,
    ...toPlaylistVideoWire(video),
  };
}

export type VideoDisplayDetails = {
  artist: string | null;
  publishedLabel: string | null;
  title: string;
};

export function getVideoDisplayDetails(video: PlaylistVideo): VideoDisplayDetails {
  const parsedTitle = parseArtistFromVideoTitle(video.title);

  return {
    artist: parsedTitle.artist ?? normalizeDisplayText(video.channelTitle),
    publishedLabel: formatPublishedDateLabel(video.publishedAt),
    title: parsedTitle.title,
  };
}

function parseArtistFromVideoTitle(title: string) {
  const trimmedTitle = title.trim();

  for (const separator of [" - ", " | ", ": ", " — ", " – "] as const) {
    const separatorIndex = trimmedTitle.indexOf(separator);

    if (separatorIndex <= 0 || separatorIndex > 80) {
      continue;
    }

    const artist = trimmedTitle.slice(0, separatorIndex).trim();
    const songTitle = trimmedTitle.slice(separatorIndex + separator.length).trim();

    if (artist.length === 0 || songTitle.length === 0) {
      continue;
    }

    return {
      artist,
      title: songTitle,
    };
  }

  return {
    artist: null,
    title: trimmedTitle,
  };
}

function formatPublishedDateLabel(publishedAt: string | null) {
  if (!publishedAt) {
    return null;
  }

  const publishedDate = new Date(publishedAt);

  if (Number.isNaN(publishedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(publishedDate);
}

function normalizeDisplayText(value: string | null) {
  const trimmedValue = value?.trim();

  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : null;
}
