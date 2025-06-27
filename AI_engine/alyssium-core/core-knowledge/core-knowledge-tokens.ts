// core-knowledge-tokens.ts
// Tokens definitions and utility functions for Alyssium Core Knowledge module

import { z } from 'zod'
import { ApiAdapter } from './api-adapter'

// Zod schema for token metadata
export const TokenInfoSchema = z.object({
  tokenId: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  totalSupply: z.string(),
  description: z.string().optional(),
})

export type TokenInfo = z.infer<typeof TokenInfoSchema>

// List of predefined knowledge topics about tokens
export const knowledgeTopics = [
  'ERC20 Standard',
  'SPL Token Standard (Solana)',
  'Token Metadata Program',
  'Minting and Burning',
  'Token Authorities',
]

/**
 * Retrieve the list of knowledge topics
 */
export function getKnowledgeTopics(): string[] {
  return knowledgeTopics
}

/**
 * Lookup token metadata by token ID via core knowledge API
 * @param tokenId SPL token address or ID
 * @param adapter ApiAdapter instance pointing to core-knowledge service
 */
export async function lookupTokenInfo(
  tokenId: string,
  adapter: ApiAdapter
): Promise<TokenInfo> {
  const raw = await adapter.get<{ data: unknown }>(`knowledge/tokens/${tokenId}`)
  const parsed = TokenInfoSchema.safeParse(raw.data)
  if (!parsed.success) {
    throw new Error(`Invalid token info format for ${tokenId}: ${parsed.error}`)
  }
  return parsed.data
}

// Example usage:
// import { ApiAdapter } from './api-adapter'
// const adapter = new ApiAdapter({ baseUrl: 'https://api.alyssium.ai' })
// const topics = getKnowledgeTopics()
// const info = await lookupTokenInfo('So11111111111111111111111111111111111111112', adapter)