/**
 * Simple in-memory cache with TTL support.
 * Used for caching expensive DB queries (filter options, dashboard stats, etc.)
 * Replace with Redis when Redis is properly set up in production.
 */
const cache = new Map();

/**
 * Get a cached value if it exists and hasn't expired.
 * @param {string} key
 * @returns {*} cached value or undefined
 */
export const cacheGet = (key) => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
};

/**
 * Set a value in the cache with a TTL.
 * @param {string} key
 * @param {*} value
 * @param {number} ttlMs - time to live in milliseconds
 */
export const cacheSet = (key, value, ttlMs) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

/**
 * Invalidate a specific cache key.
 * @param {string} key
 */
export const cacheInvalidate = (key) => {
  cache.delete(key);
};

/**
 * Invalidate all keys matching a prefix.
 * @param {string} prefix
 */
export const cacheInvalidatePrefix = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};
