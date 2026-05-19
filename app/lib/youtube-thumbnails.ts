import type { PlaylistVideoThumbnails } from "../types/playlist";

const youtubeThumbnailHost = "https://i.ytimg.com/vi";

export function getYouTubeVideoThumbnails(
  videoId: string,
): PlaylistVideoThumbnails {
  return {
    default: `${youtubeThumbnailHost}/${videoId}/default.jpg`,
    medium: `${youtubeThumbnailHost}/${videoId}/mqdefault.jpg`,
    high: `${youtubeThumbnailHost}/${videoId}/hqdefault.jpg`,
  };
}

export function getYouTubePreviewThumbnailUrl(videoId: string) {
  return getYouTubeVideoThumbnails(videoId).high;
}
