import "server-only";

type RateLimitBucket = {
  count: number;
  windowStart: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

const globalStore = globalThis as typeof globalThis & {
  __playlistlyRateLimitBuckets?: RateLimitStore;
};

function getStore(): RateLimitStore {
  if (!globalStore.__playlistlyRateLimitBuckets) {
    globalStore.__playlistlyRateLimitBuckets = new Map();
  }
  return globalStore.__playlistlyRateLimitBuckets;
}

export type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now - bucket.windowStart >= config.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.max - 1 };
  }

  if (bucket.count >= config.max) {
    const retryAfterMs = config.windowMs - (now - bucket.windowStart);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: config.max - bucket.count };
}

let pruneTick = 0;

/** Drop expired buckets so long-running servers do not grow memory forever. */
export function pruneRateLimitStore(windowMs: number) {
  pruneTick += 1;
  if (pruneTick % 50 !== 0) {
    return;
  }

  const store = getStore();
  const now = Date.now();

  for (const [key, bucket] of store) {
    if (now - bucket.windowStart >= windowMs) {
      store.delete(key);
    }
  }
}
