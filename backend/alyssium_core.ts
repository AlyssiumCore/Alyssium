// oracle_module.ts - handles AI oracle logic for token risk inference and data enrichment

import { PublicKey } from "@solana/web3.js"

export interface TokenInsight {
  address: string
  riskScore: number
  volatility: number
  enrichedMeta: Record<string, any>
}

export class OracleModule {
  private trustedThreshold: number = 0.65

  assessTokenRisk(volume: number, holders: number, ageDays: number): number {
    const risk = Math.max(0, 1 - (volume / 1000000) * 0.4 - (holders / 1000) * 0.3 - (ageDays / 365) * 0.3)
    return parseFloat(risk.toFixed(4))
  }

  isTrusted(score: number): boolean {
    return score < this.trustedThreshold
  }

  enrichMetadata(address: string, metadata: Record<string, any>): TokenInsight {
    const volatility = this.estimateVolatility(metadata.priceHistory || [])
    const riskScore = this.assessTokenRisk(metadata.volume || 0, metadata.holders || 0, metadata.ageDays || 0)

    return {
      address,
      riskScore,
      volatility,
      enrichedMeta: {
        name: metadata.name || "Unknown",
        symbol: metadata.symbol || "???",
        launchDate: metadata.launchDate || null,
        categories: metadata.categories || [],
      },
    }
  }

  private estimateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0
    const changes = prices.slice(1).map((p, i) => Math.abs((p - prices[i]) / prices[i]))
    const averageChange = changes.reduce((sum, c) => sum + c, 0) / changes.length
    return parseFloat((averageChange * 100).toFixed(2))
  }
}
