// dexscreener-adapter.ts
import fetch from 'node-fetch'

export interface PairInfo {
  pair: string
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
}

export class DexscreenerAdapter {
  private baseUrl = 'https://api.dexscreener.io/latest/dex/tokens'

  async fetchPair(tokenAddress: string): Promise<PairInfo | null> {
    const url = `${this.baseUrl}/${tokenAddress}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const data = json.pairs?.[0]
    if (!data) return null
    return {
      pair: data.pairAddress,
      price: parseFloat(data.priceUsd),
      priceChange24h: parseFloat(data.priceChange.h24),
      volume24h: parseFloat(data.volume.h24),
      liquidity: parseFloat(data.liquidity.usd)
    }
  }

  async fetchTopPairs(chain: string, limit = 10): Promise<PairInfo[]> {
    const url = `https://api.dexscreener.io/latest/dex/${chain}/pairs?limit=${limit}`
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json()
    return json.pairs.slice(0, limit).map((data: any) => ({
      pair: data.pairAddress,
      price: parseFloat(data.priceUsd),
      priceChange24h: parseFloat(data.priceChange.h24),
      volume24h: parseFloat(data.volume.h24),
      liquidity: parseFloat(data.liquidity.usd)
    }))
  }
}
