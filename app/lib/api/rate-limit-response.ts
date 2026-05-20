import "server-only";

import { NextResponse } from "next/server";
import type { RateLimitResult } from "./rate-limit";

export function rateLimitExceededResponse(
  result: Extract<RateLimitResult, { allowed: false }>,
) {
  return NextResponse.json(
    { error: "Too many playlist requests. Wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
