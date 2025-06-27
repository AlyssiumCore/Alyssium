
// alyssium_core.ts - main Solana-adapted core logic for AI analytics engine

import { Connection, PublicKey } from "@solana/web3.js"

export class AlyssiumCore {
  private connection: Connection
  private programId: PublicKey

  constructor(rpcUrl: string, programIdStr: string) {
    this.connection = new Connection(rpcUrl, "confirmed")
    this.programId = new PublicKey(programIdStr)
  }

  async fetchTokenData(address: string): Promise<any> {
    const pubkey = new PublicKey(address)
    const accountInfo = await this.connection.getAccountInfo(pubkey)
    if (!accountInfo) throw new Error("Token data not found")

    return {
      lamports: accountInfo.lamports,
      executable: accountInfo.executable,
      owner: accountInfo.owner.toBase58(),
      dataLength: accountInfo.data.length
    }
  }

  computeSigilScore(input: number[]): number {
    const weights = [0.4, 0.3, 0.2, 0.1]
    const limited = input.slice(0, weights.length)
    return limited.reduce((acc, val, idx) => acc + val * weights[idx], 0)
  }

  detectOnChainPattern(values: number[]): string {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    const threshold = values.filter(v => v > avg).length

    if (threshold > values.length * 0.7) return "Pattern: Accumulation"
    if (threshold < values.length * 0.3) return "Pattern: Distribution"
    return "Pattern: Neutral"
  }

  async validateAccessKey(wallet: string): Promise<boolean> {
    const pubkey = new PublicKey(wallet)
    const balance = await this.connection.getBalance(pubkey)
    return balance > 10000000 // e.g., 0.01 SOL minimum access
  }

  analyzeWalletHealth(holdings: number, activityScore: number): string {
    if (holdings > 10000 && activityScore > 75) return "Prime Wallet"
    if (holdings < 1000 || activityScore < 30) return "High Risk"
    return "Stable"
  }
}

export default AlyssiumCore
