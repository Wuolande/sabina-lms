/**
 * Enterprise In-Memory / IP-Account Token Bucket Rate Limiter
 * -----------------------------------------------------------------------
 * Prevents brute force and denial of service attacks against critical auth endpoints
 * (login, password reset requests, token validations).
 * -----------------------------------------------------------------------
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale keys periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now && (!val.lockedUntil || val.lockedUntil < now)) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Maximum number of allowed attempts before rate-limiting */
  maxAttempts: number;
  /** Window duration in milliseconds (e.g. 60_000 for 1 minute) */
  windowMs: number;
  /** Lockout duration in milliseconds upon exceeding max attempts */
  lockoutDurationMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  isLockedOut?: boolean;
}

/**
 * Checks and increments rate limit for a specific identifier (e.g., IP address or email).
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxAttempts: 5, windowMs: 60_000, lockoutDurationMs: 300_000 }
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // If currently in a lockout period
  if (record?.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      isLockedOut: true,
    };
  }

  // If no previous record or expired window
  if (!record || record.resetAt < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      retryAfterSeconds: 0,
    };
  }

  // Increment count
  record.count += 1;

  if (record.count > options.maxAttempts) {
    const lockoutMs = options.lockoutDurationMs || options.windowMs;
    record.lockedUntil = now + lockoutMs;
    const retryAfterSeconds = Math.ceil(lockoutMs / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      isLockedOut: true,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.maxAttempts - record.count),
    retryAfterSeconds: 0,
  };
}

/**
 * Resets rate limit for an identifier upon successful authentication.
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}
