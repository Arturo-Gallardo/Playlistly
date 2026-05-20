import "server-only";

import type {
  PlaylistVideoWire,
  YouTubePlaylist,
} from "../../types/playlist";

const YOUTUBE_PLAYLIST_ITEMS_URL =
  "https://www.googleapis.com/youtube/v3/playlistItems";
const YOUTUBE_PLAYLISTS_URL = "https://www.googleapis.com/youtube/v3/playlists";
export const MAX_PLAYLIST_VIDEOS = 5000;
const DEFAULT_USER_PLAYLIST_LIMIT = 200;

type YouTubeThumbnail = {
  url?: string;
};

type YouTubeThumbnails = {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
};

type YouTubePlaylistItem = {
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    resourceId?: {
      videoId?: string;
    };
    thumbnails?: YouTubeThumbnails;
  };
};

type YouTubePlaylistItemsResponse = {
  nextPageToken?: string;
  items?: YouTubePlaylistItem[];
  error?: {
    message?: string;
  };
};

type YouTubeUserPlaylistItem = {
  id?: string;
  snippet?: {
    title?: string;
    thumbnails?: YouTubeThumbnails;
  };
  contentDetails?: {
    itemCount?: number;
  };
};

type YouTubePlaylistsResponse = {
  nextPageToken?: string;
  items?: YouTubeUserPlaylistItem[];
  error?: {
    message?: string;
  };
};

type YouTubeCredential =
  | {
      type: "apiKey";
      value: string;
    }
  | {
      type: "accessToken";
      value: string;
    };

export class YouTubePlaylistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubePlaylistError";
  }
}

export function getPlaylistId(input: string) {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return null;
  }

  try {
    const url = new URL(trimmedInput);
    return url.searchParams.get("list");
  } catch {
    return trimmedInput;
  }
}

export async function fetchYouTubePlaylistVideos(
  input: string,
  accessToken?: string,
) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = getPlaylistId(input);

  if (!apiKey && !accessToken) {
    throw new YouTubePlaylistError(
      "Add YOUTUBE_API_KEY to your .env.local file.",
    );
  }

  if (!playlistId) {
    throw new YouTubePlaylistError(
      "Paste a YouTube playlist URL or playlist ID.",
    );
  }

  // signed-in loads use oauth so private playlists can work when youtube allows it
  const credential: YouTubeCredential = accessToken
    ? { type: "accessToken", value: accessToken }
    : { type: "apiKey", value: apiKey ?? "" };
  const videos: PlaylistVideoWire[] = [];
  let nextPageToken: string | undefined;

  // youtube only returns 50 items at a time, so larger playlists need paging
  while (videos.length < MAX_PLAYLIST_VIDEOS) {
    const page = await fetchPlaylistPage({
      credential,
      playlistId,
      pageToken: nextPageToken,
    });

    videos.push(
      ...page.items.map(toPlaylistVideoWire).filter(isPlaylistVideoWire),
    );

    if (!page.nextPageToken) {
      break;
    }

    nextPageToken = page.nextPageToken;
  }

  return videos.slice(0, MAX_PLAYLIST_VIDEOS);
}

export async function fetchYouTubeUserPlaylists(accessToken: string) {
  const playlists: YouTubePlaylist[] = [];
  let nextPageToken: string | undefined;

  // this lists playlists owned by the signed-in account
  while (playlists.length < DEFAULT_USER_PLAYLIST_LIMIT) {
    const page = await fetchUserPlaylistsPage({
      accessToken,
      pageToken: nextPageToken,
    });

    playlists.push(
      ...page.items.map(toYouTubePlaylist).filter(isYouTubePlaylist),
    );

    if (!page.nextPageToken) {
      break;
    }

    nextPageToken = page.nextPageToken;
  }

  return playlists.slice(0, DEFAULT_USER_PLAYLIST_LIMIT);
}

async function fetchPlaylistPage({
  credential,
  playlistId,
  pageToken,
}: {
  credential: YouTubeCredential;
  playlistId: string;
  pageToken?: string;
}) {
  const params = new URLSearchParams({
    part: "snippet",
    maxResults: "50",
    playlistId,
    fields:
      "nextPageToken,items(snippet(title,channelTitle,publishedAt,resourceId(videoId)))",
  });

  const headers = new Headers();

  // public playlist loads use the api key, signed-in loads use bearer auth
  if (credential.type === "apiKey") {
    params.set("key", credential.value);
  } else {
    headers.set("Authorization", `Bearer ${credential.value}`);
  }

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await fetch(`${YOUTUBE_PLAYLIST_ITEMS_URL}?${params}`, {
    headers,
    next: { revalidate: 300 },
  });
  const data = (await response.json()) as YouTubePlaylistItemsResponse;

  if (!response.ok) {
    throw new YouTubePlaylistError(
      data.error?.message ?? "YouTube rejected the playlist request.",
    );
  }

  return {
    items: data.items ?? [],
    nextPageToken: data.nextPageToken,
  };
}

async function fetchUserPlaylistsPage({
  accessToken,
  pageToken,
}: {
  accessToken: string;
  pageToken?: string;
}) {
  const params = new URLSearchParams({
    mine: "true",
    part: "snippet,contentDetails",
    maxResults: "50",
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await fetch(`${YOUTUBE_PLAYLISTS_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const data = (await response.json()) as YouTubePlaylistsResponse;

  if (!response.ok) {
    throw new YouTubePlaylistError(
      data.error?.message ?? "YouTube rejected the playlist list request.",
    );
  }

  return {
    items: data.items ?? [],
    nextPageToken: data.nextPageToken,
  };
}

function toPlaylistVideoWire(item: YouTubePlaylistItem) {
  const snippet = item.snippet;
  const videoId = snippet?.resourceId?.videoId;

  // skip deleted/private entries that youtube returns without usable video data
  if (!videoId || !snippet?.title) {
    return null;
  }

  return {
    id: videoId,
    title: snippet.title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    channelTitle: snippet.channelTitle ?? null,
    publishedAt: snippet.publishedAt ?? null,
  } satisfies PlaylistVideoWire;
}

function toYouTubePlaylist(item: YouTubeUserPlaylistItem) {
  if (!item.id || !item.snippet?.title) {
    return null;
  }

  return {
    id: item.id,
    title: item.snippet.title,
    thumbnailUrl: getPreviewThumbnailUrl(item.snippet.thumbnails),
    itemCount: item.contentDetails?.itemCount ?? null,
  } satisfies YouTubePlaylist;
}

function isPlaylistVideoWire(
  video: PlaylistVideoWire | null,
): video is PlaylistVideoWire {
  return video !== null;
}

function isYouTubePlaylist(
  playlist: YouTubePlaylist | null,
): playlist is YouTubePlaylist {
  return playlist !== null;
}

function getPreviewThumbnailUrl(thumbnails: YouTubeThumbnails | undefined) {
  return (
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.maxres?.url ??
    null
  );
}
