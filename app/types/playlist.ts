export type PlaylistVideoThumbnails = {
  default: string | null;
  medium: string | null;
  high: string | null;
};

export type PlaylistVideoWire = {
  id: string;
  title: string;
  url: string;
  channelTitle: string | null;
  publishedAt: string | null;
};

export type PlaylistVideo = PlaylistVideoWire & {
  thumbnailUrl: string | null;
  thumbnailUrls: PlaylistVideoThumbnails;
};

export type PlaylistApiWireSuccess = {
  videos: PlaylistVideoWire[];
};

export type YouTubePlaylist = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  itemCount: number | null;
};

export type PlaylistApiSuccess = {
  videos: PlaylistVideo[];
};

export type PlaylistApiError = {
  error: string;
};

export type PlaylistApiResponse =
  | PlaylistApiSuccess
  | PlaylistApiWireSuccess
  | PlaylistApiError;

export type YouTubePlaylistsApiSuccess = {
  playlists: YouTubePlaylist[];
};

export type YouTubePlaylistsApiResponse =
  | YouTubePlaylistsApiSuccess
  | PlaylistApiError;
