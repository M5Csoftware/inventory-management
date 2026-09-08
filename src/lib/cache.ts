import { LRUCache } from 'lru-cache';

/**
 * LRU Cache for API GET requests and network payloads.
 * Default TTL: 60 seconds. Max 200 cached responses.
 */
export const apiLruCache = new LRUCache<string, any>({
  max: 200,
  ttl: 1000 * 60, // 60 seconds default TTL
  allowStale: false,
  updateAgeOnGet: true,
});

/**
 * LRU Cache for expensive CPU/Data Computations
 * (e.g., historical monthly stock calculations, filtered report summaries, metrics).
 * Default TTL: 5 minutes. Max 500 cached entries.
 */
export const computationLruCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  allowStale: false,
  updateAgeOnGet: true,
});

/**
 * Fetch data with LRU caching.
 * If cached and fresh, returns cached response immediately.
 * Otherwise executes fetcher and caches the result.
 */
export async function getCachedAsync<T extends {} = any>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = apiLruCache.get(key) as T | undefined;
  if (cached !== undefined) {
    return cached;
  }

  const result = await fetcher();
  apiLruCache.set(key, result, { ttl: ttlMs });
  return result;
}

/**
 * Compute value with LRU caching.
 * Synchronous memoization helper for heavy loops, groupings, and statistics.
 */
export function getCachedSync<T extends {} = any>(
  key: string,
  computer: () => T,
  ttlMs?: number
): T {
  const cached = computationLruCache.get(key) as T | undefined;
  if (cached !== undefined) {
    return cached;
  }

  const result = computer();
  computationLruCache.set(key, result, { ttl: ttlMs });
  return result;
}

/**
 * Invalidate cache entries by exact key or prefix.
 * If prefix is omitted, clears all cached entries.
 */
export function invalidateCache(prefixOrKey?: string): void {
  if (!prefixOrKey) {
    apiLruCache.clear();
    computationLruCache.clear();
    return;
  }

  // Invalidate matching keys in api cache
  for (const key of Array.from(apiLruCache.keys())) {
    if (typeof key === 'string' && key.startsWith(prefixOrKey)) {
      apiLruCache.delete(key);
    }
  }

  // Invalidate matching keys in computation cache
  for (const key of Array.from(computationLruCache.keys())) {
    if (typeof key === 'string' && key.startsWith(prefixOrKey)) {
      computationLruCache.delete(key);
    }
  }
}

/**
 * Generic memoizer wrapping a function with an LRU cache.
 */
export function memoizeWithLru<Args extends any[], R extends {} = any>(
  fn: (...args: Args) => R,
  keyGenerator?: (...args: Args) => string,
  maxSize: number = 100
): (...args: Args) => R {
  const cache = new LRUCache<string, any>({ max: maxSize });

  return (...args: Args): R => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    const cached = cache.get(key) as R | undefined;
    if (cached !== undefined) {
      return cached;
    }
    const computed = fn(...args);
    cache.set(key, computed);
    return computed;
  };
}
