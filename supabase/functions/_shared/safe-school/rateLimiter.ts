/**
 * Rate limiting utility for SafeSchool Auth Service
 * Uses in-memory storage (simple implementation for Edge Functions)
 * For production, consider using Redis or Supabase KV
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (cleared on function restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitConfig() {
  const windowSeconds = parseInt(Deno.env.get('RATE_LIMIT_WINDOW_SECONDS') || '60', 10);
  const maxRequests = parseInt(Deno.env.get('RATE_LIMIT_MAX') || '100', 10);
  return { windowSeconds, maxRequests };
}

function getKey(identifier: string, path: string): string {
  return `${path}:${identifier}`;
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  path: string,
): RateLimitResult {
  const { windowSeconds, maxRequests } = getRateLimitConfig();
  
  // If rate limiting is disabled (0 or negative), allow all requests
  if (windowSeconds <= 0 || maxRequests <= 0) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }

  // Cleanup expired entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const key = getKey(identifier, path);
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window or expired entry
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getClientIdentifier(req: Request): string {
  // Try to get IP from various headers (for proxy/load balancer scenarios)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier if IP cannot be determined
  return 'unknown';
}

