import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { rateLimitExceededResponse } from "../../lib/api/rate-limit-response";
import { enforcePlaylistFetchLimit } from "../../lib/api/youtube-rate-limit";
import {
  fetchYouTubePlaylistVideos,
  parsePlaylistQuery,
  YouTubePlaylistError,
} from "../../lib/youtube/youtube-playlist";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = parsePlaylistQuery(searchParams.get("playlist") ?? "");

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const token = await getToken({ req: request });
  const rateLimit = enforcePlaylistFetchLimit(request, token?.sub);

  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }

  try {
    // signed-in users get oauth access, public users fall back to the api key
    const videos = await fetchYouTubePlaylistVideos(
      parsed.playlistId,
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
