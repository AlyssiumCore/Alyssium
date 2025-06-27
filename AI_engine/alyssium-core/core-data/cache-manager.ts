// cache-manager.ts
// Cache management utilities for Alyssium Core

export interface CacheOptions {
  ttlSeconds?: number  // Time-to-live in seconds
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class CacheManager {
  private store: Map<string, CacheEntry<unknown>> = new Map()
  private defaultTTL: number

  constructor(options?: CacheOptions) {
    // default TTL: 60 seconds
    this.defaultTTL = (options?.ttlSeconds ?? 60) * 1000
  }

  // Set a value in the cache with optional custom TTL
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl
    }
    this.store.set(key, entry)
  }

  // Get a value; returns undefined if expired or missing
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }

    return entry.value
  }

  // Delete a specific key
  delete(key: string): void {
    this.store.delete(key)
  }

  // Clear all cache entries
  clear(): void {
    this.store.clear()
  }

  // Purge expired entries (useful for manual cleanup)
  purgeExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }
}

// Example usage:
// const cache = new CacheManager({ ttlSeconds: 120 })
// cache.set('tokenData', { price: 10.5 })
// const data = cache.get<{ price: number }>('tokenData')
