import type { PlaylistVideo } from "../types/playlist";

const videoTitles = [
  "playlist overview",
  "setup and basics",
  "deep dive",
  "real examples",
  "quick tips",
  "final recap",
];

// a longer playlist makes the grid feel closer to the final app
export const sampleVideos: PlaylistVideo[] = Array.from({ length: 60 }, (_, index) => ({
  id: `video-${index + 1}`,
  title: videoTitles[index % videoTitles.length],
  url: "https://www.youtube.com",
  channelTitle: null,
  publishedAt: null,
  thumbnailUrl: null,
  thumbnailUrls: {
    default: null,
    medium: null,
    high: null,
  },
}));
