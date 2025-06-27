// solana-executor.ts
// Solana execution agent logic for Alyssium Core Trading module

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'

export interface ExecutorConfig {
  rpcUrl: string
  commitment?: 'processed' | 'confirmed' | 'finalized'
}

export class SolanaExecutor {
  private connection: Connection
  private payer: Keypair

  constructor(payer: Keypair, config: ExecutorConfig) {
    this.payer = payer
    this.connection = new Connection(config.rpcUrl, config.commitment || 'confirmed')
  }

  /**
   * Request airdrop of SOL (useful on testnet/devnet)
   */
  async requestAirdrop(amountSol: number): Promise<string> {
    const sig = await this.connection.requestAirdrop(
      this.payer.publicKey,
      amountSol * LAMPORTS_PER_SOL
    )
    await this.connection.confirmTransaction(sig)
    return sig
  }

  /**
   * Transfer SOL to a recipient
   */
  async transferSol(
    to: PublicKey,
    amountSol: number
  ): Promise<string> {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.payer.publicKey,
        toPubkey: to,
        lamports: amountSol * LAMPORTS_PER_SOL
      })
    )
    const signature = await sendAndConfirmTransaction(
      this.connection,
      tx,
      [this.payer]
    )
    return signature
  }

  /**
   * Execute a raw transaction
   */
  async executeTransaction(
    transaction: Transaction,
    signers: Keypair[] = []
  ): Promise<string> {
    transaction.feePayer = this.payer.publicKey
    transaction.recentBlockhash = (
      await this.connection.getRecentBlockhash()
    ).blockhash

    transaction.sign(this.payer, ...signers)
    const rawTx = transaction.serialize()
    const sig = await this.connection.sendRawTransaction(rawTx)
    await this.connection.confirmTransaction(sig)
    return sig
  }

  /**
   * Get SOL balance for an address
   */
  async getBalance(pubkey: PublicKey): Promise<number> {
    const lamports = await this.connection.getBalance(pubkey)
    return lamports / LAMPORTS_PER_SOL
  }
}

// Example usage:
// import { Keypair, PublicKey } from '@solana/web3.js'
// const payer = Keypair.fromSecretKey(Uint8Array.from([...]))
// const executor = new SolanaExecutor(payer, { rpcUrl: 'https://api.mainnet-beta.solana.com' })
// await executor.transferSol(new PublicKey('RecipientPubKey'), 0.1)
