

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
    // Default TTL: 60 seconds
    this.defaultTTL = (options?.ttlSeconds ?? 60) * 1000
  }

  /**
   * Store a value in cache with optional TTL override
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl
    }
    this.store.set(key, entry)
  }

  /**
   * Retrieve a cached value. Returns undefined if expired or missing.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }

    return entry.value
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  /**
   * Remove a specific key
   */
  delete(key: string): void {
    this.store.delete(key)
  }

  /**
   * Remove all cache entries
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Remove only expired entries
   */
  purgeExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Current number of entries in the cache (expired entries may be present)
   */
  size(): number {
    return this.store.size
  }
}
