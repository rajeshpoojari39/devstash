import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export type RateLimitAction =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "resend-verification";

export interface RateLimitConfig {
  limit: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  windowSeconds: number;
  keyBy: "ip" | "ip-and-identifier";
}

export const RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
  login: {
    limit: 5,
    window: "15 m",
    windowSeconds: 15 * 60,
    keyBy: "ip-and-identifier",
  },
  register: {
    limit: 3,
    window: "1 h",
    windowSeconds: 60 * 60,
    keyBy: "ip",
  },
  "forgot-password": {
    limit: 3,
    window: "1 h",
    windowSeconds: 60 * 60,
    keyBy: "ip",
  },
  "reset-password": {
    limit: 5,
    window: "15 m",
    windowSeconds: 15 * 60,
    keyBy: "ip",
  },
  "resend-verification": {
    limit: 3,
    window: "15 m",
    windowSeconds: 15 * 60,
    keyBy: "ip-and-identifier",
  },
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in ms
  retryAfterSeconds: number;
}

// Singleton Redis instance
let redisInstance: Redis | null = null;
const limiters: Partial<Record<RateLimitAction, Ratelimit>> = {};

/**
 * Returns the Redis client instance if configured with environment variables,
 * or null if unconfigured (enabling fail-open mode).
 */
export function getRedisClient(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  try {
    redisInstance = new Redis({ url, token });
    return redisInstance;
  } catch (error) {
    console.warn("Failed to initialize Upstash Redis client:", error);
    return null;
  }
}

/**
 * Retrieves or initializes a sliding-window Ratelimit instance for a specific action.
 */
function getLimiter(action: RateLimitAction): Ratelimit | null {
  if (limiters[action]) return limiters[action]!;

  const redis = getRedisClient();
  if (!redis) return null;

  const config = RATE_LIMIT_CONFIGS[action];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: `ratelimit:${action}`,
    analytics: false,
  });

  limiters[action] = limiter;
  return limiter;
}

/**
 * Extracts client IP address from a Request, Headers, or next/headers context.
 */
export function getClientIp(
  source?: Request | Headers | HeadersInit | null,
): string {
  if (!source) return "127.0.0.1";

  let headers: Headers | null = null;
  if (source instanceof Request) {
    headers = source.headers;
  } else if (source instanceof Headers) {
    headers = source;
  } else if (typeof source === "object") {
    headers = new Headers(source);
  }

  if (headers) {
    // 1. Check standard x-forwarded-for (Vercel, proxies, load balancers)
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) {
      const clientIp = forwardedFor.split(",")[0]?.trim();
      if (clientIp) return clientIp;
    }

    // 2. Check x-real-ip
    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;

    // 3. Check Cloudflare connecting IP
    const cfIp = headers.get("cf-connecting-ip")?.trim();
    if (cfIp) return cfIp;
  }

  return "127.0.0.1";
}

/**
 * Extracts client IP using next/headers if no direct request object is available.
 */
export async function getClientIpFromContext(
  source?: Request | Headers | null,
): Promise<string> {
  if (source) {
    return getClientIp(source);
  }

  try {
    const { headers } = await import("next/headers");
    const headerStore = await headers();
    return getClientIp(headerStore);
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Formats a clean composite identifier for rate limiting (e.g. IP, or IP:normalized_email).
 */
export function buildRateLimitIdentifier(
  action: RateLimitAction,
  ip: string,
  identifier?: string | null,
): string {
  const config = RATE_LIMIT_CONFIGS[action];
  if (config.keyBy === "ip-and-identifier" && identifier) {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    return `${ip}:${normalizedIdentifier}`;
  }
  return ip;
}

/**
 * Enforces rate limiting for a specific auth action and identifier.
 * Fails open (success: true) if Upstash is unconfigured or encounters an error.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[action];
  const now = Date.now();
  const defaultReset = now + config.windowSeconds * 1000;

  const limiter = getLimiter(action);

  // Fail open if Redis is not configured
  if (!limiter) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: defaultReset,
      retryAfterSeconds: 0,
    };
  }

  try {
    const result = await limiter.limit(identifier);
    const resetTime = result.reset;
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((resetTime - Date.now()) / 1000),
    );

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetTime,
      retryAfterSeconds,
    };
  } catch (error) {
    console.warn(
      `Rate limiter failed for action "${action}" (failing open):`,
      error,
    );
    return {
      success: true,
      limit: config.limit,
      remaining: 1,
      reset: defaultReset,
      retryAfterSeconds: 0,
    };
  }
}

/**
 * Creates a standardized 429 Too Many Requests response with Retry-After and rate limit headers.
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string,
): NextResponse {
  const retrySec = Math.max(1, result.retryAfterSeconds);
  const minutes = Math.ceil(retrySec / 60);

  const defaultMessage =
    minutes > 1
      ? `Too many attempts. Please try again in ${minutes} minutes.`
      : `Too many attempts. Please try again in ${retrySec} seconds.`;

  const message = customMessage || defaultMessage;

  return NextResponse.json(
    {
      error: message,
      retryAfter: retrySec,
      reset: result.reset,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retrySec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    },
  );
}
