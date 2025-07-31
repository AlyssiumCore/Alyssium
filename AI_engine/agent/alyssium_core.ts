// alyssium_core.ts — Solana-adapted core logic for AI analytics engine

import { Connection, PublicKey, AccountInfo } from "@solana/web3.js"

export interface TokenData {
  lamports: number
  executable: boolean
  owner: string
  dataLength: number
}

export type PatternType = "Accumulation" | "Distribution" | "Neutral"

export class AlyssiumCore {
  private connection: Connection
  private programId: PublicKey
  private sigilWeights: number[]

  /**
   * @param rpcUrl        Solana RPC endpoint
   * @param programIdStr  On-chain program ID
   * @param sigilWeights  Optional weights for sigil score (defaults to [0.4,0.3,0.2,0.1])
   */
  constructor(
    rpcUrl: string,
    programIdStr: string,
    sigilWeights: number[] = [0.4, 0.3, 0.2, 0.1]
  ) {
    this.connection = new Connection(rpcUrl, "confirmed")
    this.programId = new PublicKey(programIdStr)
    this.sigilWeights = sigilWeights
  }

  /** Fetch raw account info for a token address */
  async fetchTokenData(address: string): Promise<TokenData> {
    const pubkey = new PublicKey(address)
    const info = await this.connection.getAccountInfo(pubkey)
    if (!info) {
      throw new Error(`No account info for ${address}`)
    }
    return {
      lamports: info.lamports,
      executable: info.executable,
      owner: info.owner.toBase58(),
      dataLength: info.data.length,
    }
  }

  /**
   * Compute a sigil score over the first N inputs
   * where N = this.sigilWeights.length
   */
  computeSigilScore(input: number[]): number {
    const len = Math.min(input.length, this.sigilWeights.length)
    return input
      .slice(0, len)
      .reduce((sum, val, idx) => sum + val * this.sigilWeights[idx], 0)
  }

  /**
   * Detect on-chain pattern based on proportion above average
   * @returns "Pattern: Accumulation" | "Pattern: Distribution" | "Pattern: Neutral"
   */
  detectOnChainPattern(values: number[], accumulationThreshold = 0.7, distributionThreshold = 0.3): string {
    if (values.length === 0) {
      return "Pattern: Neutral"
    }
    const avg = values.reduce((s, v) => s + v, 0) / values.length
    const aboveCount = values.filter((v) => v > avg).length
    const ratio = aboveCount / values.length
    if (ratio >= accumulationThreshold) return "Pattern: Accumulation"
    if (ratio <= distributionThreshold)   return "Pattern: Distribution"
    return "Pattern: Neutral"
  }

  /** Check if a wallet has enough SOL for access (default 0.01 SOL) */
  async validateAccessKey(wallet: string, minLamports = 10_000_000): Promise<boolean> {
    const pubkey = new PublicKey(wallet)
    const balance = await this.connection.getBalance(pubkey)
    return balance >= minLamports
  }

  /**
   * Classify wallet health
   * @param holdings      number of tokens held
   * @param activityScore normalized 0–100 activity metric
   */
  analyzeWalletHealth(holdings: number, activityScore: number): "Prime Wallet" | "High Risk" | "Stable" {
    if (holdings > 10_000 && activityScore > 75) return "Prime Wallet"
    if (holdings < 1_000 || activityScore < 30)  return "High Risk"
    return "Stable"
  }
}

export default AlyssiumCore
    
