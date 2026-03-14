import { Elysia } from "elysia";
import { redis, getCachedOrFetch, invalidateCachePattern } from "../db/redis";

// Cache context type
export interface CacheContext {
  cache: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
    del: (...keys: string[]) => Promise<void>;
    getCachedOrFetch: <T>(key: string, fetchFn: () => Promise<T>, ttlSeconds?: number) => Promise<T>;
    invalidatePattern: (pattern: string) => Promise<void>;
  };
}

export const cacheMiddleware = new Elysia({ name: "cache" })
  .derive({ as: "scoped" }, (): CacheContext => ({
    cache: {
      get: (key: string) => redis.get(key),
      set: (key: string, value: string, ttlSeconds?: number) => redis.set(key, value, ttlSeconds),
      del: (...keys: string[]) => redis.del(...keys),
      getCachedOrFetch: <T>(key: string, fetchFn: () => Promise<T>, ttlSeconds?: number) =>
        getCachedOrFetch(key, fetchFn, ttlSeconds),
      invalidatePattern: (pattern: string) => invalidateCachePattern(pattern),
    },
  }));
