import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  fetchYouTubeUserPlaylists,
  YouTubePlaylistError,
} from "../../lib/youtube/youtube-playlist";

export async function GET(request: NextRequest) {
  // this route is only for account playlists, so it needs google auth
  const token = await getToken({ req: request });

  if (!token?.googleAccessToken) {
    return NextResponse.json(
      { error: "Sign in with Google to see your YouTube playlists." },
      { status: 401 },
    );
  }

  try {
    const playlists = await fetchYouTubeUserPlaylists(token.googleAccessToken);
    return NextResponse.json({ playlists });
  } catch (error) {
    if (error instanceof YouTubePlaylistError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Could not load your YouTube playlists." },
      { status: 500 },
    );
  }
}
