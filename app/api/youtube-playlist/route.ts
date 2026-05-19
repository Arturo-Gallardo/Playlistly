import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  fetchYouTubePlaylistVideos,
  YouTubePlaylistError,
} from "../../lib/youtube-playlist";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playlist = searchParams.get("playlist");

  if (!playlist) {
    return NextResponse.json(
      { error: "Add a playlist query parameter." },
      { status: 400 },
    );
  }

  try {
    // signed-in users get oauth access, public users fall back to the api key
    const token = await getToken({ req: request });
    const videos = await fetchYouTubePlaylistVideos(
      playlist,
      token?.googleAccessToken,
    );
    return NextResponse.json({ videos });
  } catch (error) {
    if (error instanceof YouTubePlaylistError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Could not load that YouTube playlist." },
      { status: 500 },
    );
  }
}
