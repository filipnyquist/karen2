import { RedisClient } from "bun";

const redisClient = new RedisClient({
  hostname: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

export const redis = {
  async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
    } catch (error) {
      console.error("Redis SET error:", error);
    }
  },

  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.error("Redis DEL error:", error);
    }
  },

  async keys(pattern: string): Promise<string[]> {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      console.error("Redis KEYS error:", error);
      return [];
    }
  },

  // Check if Redis is connected/available
  async ping(): Promise<boolean> {
    try {
      const result = await redisClient.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  },
};

// Helper to generate cache keys
export function generateCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(":");
}

// Helper to cache with automatic JSON serialization
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // Invalid JSON, fetch fresh data
    }
  }

  const data = await fetchFn();
  await redis.set(key, JSON.stringify(data), ttlSeconds);
  return data;
}

// Helper to invalidate cache by pattern
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
