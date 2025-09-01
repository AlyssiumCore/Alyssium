// alyssium_core.ts — Solana-adapted core logic for AI analytics engine (refined)

import { Commitment, Connection, PublicKey } from "@solana/web3.js"

export interface TokenData {
  lamports: number
  executable: boolean
  owner: string
  dataLength: number
}

export type PatternType = "Accumulation" | "Distribution" | "Neutral"

export interface AlyssiumCoreOptions {
  commitment?: Commitment
  /** If true, normalize sigil weights to sum=1 on construction/set */
  normalizeWeights?: boolean
}

export class AlyssiumCore {
  private connection: Connection
  private programId: PublicKey
  private sigilWeights: number[]
  private readonly normalizeWeights: boolean

  /**
   * @param rpcUrl         Solana RPC endpoint
   * @param programIdStr   On-chain program ID
   * @param sigilWeights   Optional weights for sigil score (defaults to [0.4,0.3,0.2,0.1])
   * @param opts           Extra options (commitment, normalization)
   */
  constructor(
    rpcUrl: string,
    programIdStr: string,
    sigilWeights: number[] = [0.4, 0.3, 0.2, 0.1],
    opts: AlyssiumCoreOptions = {}
  ) {
    const commitment = opts.commitment ?? "confirmed"
    this.connection = new Connection(rpcUrl, commitment)
    this.programId = new PublicKey(programIdStr)
    this.normalizeWeights = opts.normalizeWeights ?? true
    this.sigilWeights = this.prepareWeights(sigilWeights)
  }

  /** Replace sigil weights at runtime (optionally normalized) */
  setSigilWeights(weights: number[]): void {
    this.sigilWeights = this.prepareWeights(weights)
  }

  /** Return a safe copy of current weights */
  getSigilWeights(): number[] {
    return [...this.sigilWeights]
  }

  /** Fetch raw account info for a token address */
  async fetchTokenData(address: string): Promise<TokenData> {
    const pubkey = new PublicKey(address)
    const info = await this.connection.getAccountInfo(pubkey)
    if (!info) throw new Error(`No account info for ${address}`)
    return {
      lamports: info.lamports,
      executable: info.executable,
      owner: info.owner.toBase58(),
      dataLength: info.data.length,
    }
  }

  /** Fetch multiple accounts in one RPC round-trip */
  async fetchManyTokenData(addresses: string[]): Promise<(TokenData | null)[]> {
    const keys = addresses.map(a => new PublicKey(a))
    const infos = await this.connection.getMultipleAccountsInfo(keys)
    return infos.map((info, i) =>
      info
        ? {
            lamports: info.lamports,
            executable: info.executable,
            owner: info.owner.toBase58(),
            dataLength: info.data.length,
          }
        : null
    )
  }

  /**
   * Compute a sigil score over the first N inputs (N = weights length)
   * - Negative inputs are clamped to 0
   * - If fewer inputs than weights, missing values are treated as 0
   * - Result is bounded to [0, +infinity) and rounded to 6 decimals
   */
  computeSigilScore(input: number[]): number {
    const n = this.sigilWeights.length
    let sum = 0
    for (let i = 0; i < n; i++) {
      const v = Math.max(0, input[i] ?? 0)
      sum += v * this.sigilWeights[i]
    }
    return Math.round(sum * 1e6) / 1e6
  }

  /**
   * Detect on-chain pattern using proportion of values above a robust center:
   * - Uses median instead of mean to reduce sensitivity to outliers
   * - Returns a strict PatternType
   */
  detectOnChainPattern(
    values: number[],
    accumulationThreshold = 0.7,
    distributionThreshold = 0.3
  ): PatternType {
    if (values.length === 0) return "Neutral"
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const median =
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
    const above = sorted.filter(v => v > median).length
    const ratio = above / sorted.length
    if (ratio >= accumulationThreshold) return "Accumulation"
    if (ratio <= distributionThreshold) return "Distribution"
    return "Neutral"
  }

  /** Optional helper if you need a human-readable label with the type */
  patternLabel(t: PatternType): string {
    return `Pattern: ${t}`
  }

  /** Check if a wallet has enough SOL for access (default 0.01 SOL) */
  async validateAccessKey(wallet: string, minLamports = 10_000_000): Promise<boolean> {
    const pubkey = new PublicKey(wallet)
    const balance = await this.connection.getBalance(pubkey)
    return balance >= minLamports
  }

  /**
   * Classify wallet health
   * @param holdings       number of tokens held
   * @param activityScore  normalized 0–100 activity metric
   */
  analyzeWalletHealth(
    holdings: number,
    activityScore: number
  ): "Prime Wallet" | "High Risk" | "Stable" {
    if (holdings > 10_000 && activityScore > 75) return "Prime Wallet"
    if (holdings < 1_000 || activityScore < 30) return "High Risk"
    return "Stable"
  }

  /** Lightweight reachability probe for the configured RPC and program */
  async probe(): Promise<{ slot: number; programId: string }> {
    const slot = await this.connection.getSlot()
    return { slot, programId: this.programId.toBase58() }
  }

  // ---- internals ----

  private prepareWeights(weights: number[]): number[] {
    if (!Array.isArray(weights) || weights.length === 0) {
      throw new Error("sigilWeights must be a non-empty array")
    }
    if (!weights.every(n => Number.isFinite(n) && n >= 0)) {
      throw new Error("sigilWeights must be non-negative finite numbers")
    }
    if (!this.normalizeWeights) return [...weights]
    const sum = weights.reduce((a, b) => a + b, 0)
    if (sum === 0) throw new Error("sigilWeights sum must be > 0 when normalization is enabled")
    // Normalize to sum=1, keep deterministic precision
    const norm = weights.map(w => w / sum)
    // Trim floating error
    const rounded = norm.map(w => Math.round(w * 1e12) / 1e12)
    return rounded
  }
}

export default AlyssiumCore
