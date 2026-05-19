import {
  getYouTubePreviewThumbnailUrl,
  getYouTubeVideoThumbnails,
} from "./youtube-thumbnails";
import type { CanvasVideoWire } from "../types/canvas-snapshot";
import type { PlaylistVideo, PlaylistVideoWire } from "../types/playlist";

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
