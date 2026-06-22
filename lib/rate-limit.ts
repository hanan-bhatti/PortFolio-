/**
 * @file lib/rate-limit.ts
 * @description Lightweight in-memory rate limiter to restrict anonymous public requests.
 * 
 * @exports
 * - isRateLimited(): Function
 */

const tracker = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 45;    // Max 45 requests per minute per key (visitorId + route)

/**
 * Checks if a visitor/IP has exceeded their request limit.
 * @param key Unique identifier for the rate limit client (e.g., visitorId:postId:reaction)
 * @returns boolean True if the client is rate limited, false otherwise
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = tracker.get(key);

  if (!record) {
    tracker.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  if (now > record.resetTime) {
    tracker.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS;
}
