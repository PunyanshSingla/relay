interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const MAX_ENTRIES = 2000;

function evictOldest(): void {
  const oldestKey = cache.keys().next().value;
  if (oldestKey) cache.delete(oldestKey);
}

export function gmailCacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function gmailCacheSet<T>(key: string, data: T, ttlMs: number): void {
  if (cache.size >= MAX_ENTRIES) {
    evictOldest();
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function gmailCacheInvalidate(tenantId: string, pattern?: string): void {
  const prefix = `${tenantId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      if (!pattern || key.includes(pattern)) {
        cache.delete(key);
      }
    }
  }
}
