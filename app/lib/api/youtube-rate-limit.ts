import "server-only";

import type { NextRequest } from "next/server";
import { getClientIp } from "./client-ip";
import {
  checkRateLimit,
  pruneRateLimitStore,
  type RateLimitResult,
} from "./rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// Anonymous loads burn the shared API key — keep this tight.
const ANON_PLAYLIST_LIMIT = { max: 15, windowMs: FIFTEEN_MINUTES_MS };
const AUTH_PLAYLIST_LIMIT = { max: 40, windowMs: FIFTEEN_MINUTES_MS };
const AUTH_PLAYLISTS_LIMIT = { max: 30, windowMs: FIFTEEN_MINUTES_MS };
// Shared ceiling per IP so one client cannot spam even with multiple accounts.
const IP_CEILING_LIMIT = { max: 80, windowMs: FIFTEEN_MINUTES_MS };

function checkIpCeiling(request: NextRequest): RateLimitResult {
  const ip = getClientIp(request);
  return checkRateLimit(`ip:${ip}`, IP_CEILING_LIMIT);
}

export function enforcePlaylistFetchLimit(
  request: NextRequest,
  userId?: string | null,
): RateLimitResult {
  pruneRateLimitStore(FIFTEEN_MINUTES_MS);

  const ipResult = checkIpCeiling(request);
  if (!ipResult.allowed) {
    return ipResult;
  }

  if (userId) {
    return checkRateLimit(`user:playlist:${userId}`, AUTH_PLAYLIST_LIMIT);
  }

  const ip = getClientIp(request);
  return checkRateLimit(`anon:playlist:${ip}`, ANON_PLAYLIST_LIMIT);
}

export function enforceUserPlaylistsLimit(
  request: NextRequest,
  userId: string,
): RateLimitResult {
  pruneRateLimitStore(FIFTEEN_MINUTES_MS);

  const ipResult = checkIpCeiling(request);
  if (!ipResult.allowed) {
    return ipResult;
  }

  return checkRateLimit(`user:playlists:${userId}`, AUTH_PLAYLISTS_LIMIT);
}
