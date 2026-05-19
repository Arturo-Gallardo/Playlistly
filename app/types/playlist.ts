export type PlaylistVideo = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  channelTitle: string | null;
  publishedAt: string | null;
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

export type PlaylistApiResponse = PlaylistApiSuccess | PlaylistApiError;

export type YouTubePlaylistsApiSuccess = {
  playlists: YouTubePlaylist[];
};

export type YouTubePlaylistsApiResponse =
  | YouTubePlaylistsApiSuccess
  | PlaylistApiError;
