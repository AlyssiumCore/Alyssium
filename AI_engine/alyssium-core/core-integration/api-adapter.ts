// api-adapter.ts
// API adapter for external services in Alyssium Core

import fetch, { RequestInit, Response } from 'node-fetch'
import { CacheManager } from './cache-manager'

export interface ApiAdapterOptions {
  baseUrl: string
  defaultHeaders?: Record<string, string>
  cacheTTL?: number  // in seconds
}

export class ApiAdapter {
  private baseUrl: string
  private headers: Record<string, string>
  private cache: CacheManager

  constructor(options: ApiAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.headers = options.defaultHeaders ?? {}
    this.cache = new CacheManager({ ttlSeconds: options.cacheTTL })
  }

  /**
   * Perform a GET request, with optional caching
   */
  async get<T>(path: string, useCache: boolean = true): Promise<T> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`
    if (useCache) {
      const cached = this.cache.get<T>(url)
      if (cached) return cached
    }

    const response = await this.request<T>(url, { method: 'GET' })
    this.cache.set(url, response)
    return response
  }

  /**
   * Generic request handler
   */
  async request<T>(url: string, options: RequestInit): Promise<T> {
    const init: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
        ...(options.headers ?? {})
      }
    }

    const res: Response = await fetch(url, init)
    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`)
    }
    return res.json() as Promise<T>
  }

  /**
   * Invalidate cache for a given endpoint
   */
  invalidate(path: string): void {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`
    this.cache.delete(url)
  }
}
