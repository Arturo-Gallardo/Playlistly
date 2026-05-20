import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import type {
  SaveYouTubePlaylistRequest,
  YouTubePlaylistPrivacyStatus,
} from "../../../types/playlist";
import {
  appendVideosToYouTubePlaylist,
  createYouTubePlaylist,
  getYouTubePlaylistUrl,
  MAX_PLAYLIST_VIDEOS,
  YouTubePlaylistError,
} from "../../../lib/youtube-playlist";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token?.googleAccessToken) {
    return NextResponse.json(
      { error: "Sign in with Google to save playlists to YouTube." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The save request body was not valid JSON." },
      { status: 400 },
    );
  }

  const parsed = parseSaveRequest(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    let playlistId = parsed.playlistId ?? "";

    if (parsed.mode === "new") {
      playlistId = await createYouTubePlaylist(token.googleAccessToken, {
        title: parsed.title ?? "Playlistly export",
        privacyStatus: parsed.privacyStatus,
      });
    }

    await appendVideosToYouTubePlaylist(token.googleAccessToken, {
      playlistId,
      videoIds: parsed.videoIds,
    });

    return NextResponse.json({
      playlistId,
      playlistUrl: getYouTubePlaylistUrl(playlistId),
    });
  } catch (error) {
    if (error instanceof YouTubePlaylistError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Could not save the playlist to YouTube." },
      { status: 500 },
    );
  }
}

function parseSaveRequest(
  body: unknown,
):
  | SaveYouTubePlaylistRequest
  | {
      error: string;
    } {
  if (!isRecord(body)) {
    return { error: "The save request was not readable." };
  }

  const mode = body.mode;

  if (mode !== "new" && mode !== "existing") {
    return { error: "Choose whether to create a new playlist or use an existing one." };
  }

  if (!Array.isArray(body.videoIds) || body.videoIds.length === 0) {
    return { error: "Select at least one video to save." };
  }

  const videoIds = body.videoIds.filter(
    (videoId): videoId is string =>
      typeof videoId === "string" && videoId.trim().length > 0,
  );

  if (videoIds.length === 0) {
    return { error: "Select at least one video to save." };
  }

  if (videoIds.length > MAX_PLAYLIST_VIDEOS) {
    return {
      error: `You can save up to ${MAX_PLAYLIST_VIDEOS} videos at once.`,
    };
  }

  if (mode === "new") {
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return { error: "Enter a title for the new playlist." };
    }

    return {
      mode,
      videoIds,
      title,
      privacyStatus: parsePrivacyStatus(body.privacyStatus),
    };
  }

  const playlistId =
    typeof body.playlistId === "string" ? body.playlistId.trim() : "";

  if (!playlistId) {
    return { error: "Pick a playlist to add videos to." };
  }

  return {
    mode,
    videoIds,
    playlistId,
  };
}

function parsePrivacyStatus(
  value: unknown,
): YouTubePlaylistPrivacyStatus | undefined {
  if (value === "public" || value === "unlisted" || value === "private") {
    return value;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
