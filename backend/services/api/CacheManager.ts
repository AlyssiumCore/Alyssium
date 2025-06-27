import fetch from 'node-fetch'
import { CacheManager } from './cache-manager'

export interface PairInfo {
  pair: string
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
}

export interface DexscreenerAdapterOptions {
  baseUrl?: string
  cacheTTL?: number
}

export class DexscreenerAdapter {
  private baseUrl: string
  private cache: CacheManager

  constructor(options?: DexscreenerAdapterOptions) {
    this.baseUrl = options?.baseUrl ?? 'https://api.dexscreener.io/latest/dex'
    this.cache = new CacheManager({ ttlSeconds: options?.cacheTTL })
  }

  private async get<T>(url: string): Promise<T | null> {
    const cached = this.cache.get<T>(url)
    if (cached) return cached

    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as T
    this.cache.set(url, data)
    return data
  }

  async fetchPair(tokenAddress: string): Promise<PairInfo | null> {
    const url = `${this.baseUrl}/tokens/${tokenAddress}`
    const json = await this.get<{ pairs: any[] }>(url)
    const data = json?.pairs?.[0]
    if (!data) return null
    return {
      pair: data.pairAddress,
      price: +data.priceUsd,
      priceChange24h: +data.priceChange.h24,
      volume24h: +data.volume.h24,
      liquidity: +data.liquidity.usd
    }
  }

  async fetchTopPairs(chain: string, limit = 10): Promise<PairInfo[]> {
    const url = `${this.baseUrl}/${chain}/pairs?limit=${limit}`
    const json = await this.get<{ pairs: any[] }>(url)
    if (!json) return []
    return json.pairs.slice(0, limit).map(data => ({
      pair: data.pairAddress,
      price: +data.priceUsd,
      priceChange24h: +data.priceChange.h24,
      volume24h: +data.volume.h24,
      liquidity: +data.liquidity.usd
    }))
  }
}
