import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

export const redisConnection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});

/**
 * Checks and increments an atomic hourly rate limit counter in Redis.
 * Key format: `ratelimit:{userId}:{yyyy-mm-dd-HH}`
 * Returns object containing allowed status, current count, and seconds remaining in current hour window.
 */
export async function checkAndIncrementRateLimit(
  userId: string,
  limit: number
): Promise<{ allowed: boolean; currentCount: number; ttlSeconds: number }> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 13); // e.g. "2026-08-28T21"
  const key = `ratelimit:${userId}:${dateStr}`;

  // Atomic increment
  const count = await redisConnection.incr(key);

  // If this is the first increment for this hour window, set 1-hour expiration (3600 seconds)
  if (count === 1) {
    await redisConnection.expire(key, 3600);
  }

  // Get TTL remaining for key
  let ttlSeconds = await redisConnection.ttl(key);
  if (ttlSeconds <= 0) {
    // Fallback: calculate seconds left until next top-of-hour
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    ttlSeconds = Math.ceil((nextHour.getTime() - now.getTime()) / 1000);
  }

  return {
    allowed: count <= limit,
    currentCount: count,
    ttlSeconds,
  };
}
