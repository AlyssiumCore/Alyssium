// core_knowledge_tokens.ts
// Definitions and utility functions for the Core Knowledge Tokens module

import { z } from "zod"
import { ApiAdapter } from "./api-adapter"

// ----------------------------
// Schemas and types
// ----------------------------

/**
 * schema for token metadata
 * ensures required fields and allows optional description + extensions
 */
export const TokenInfoSchema = z.object({
  tokenId: z.string().min(1, "tokenId is required"),
  name: z.string().min(1, "name is required"),
  symbol: z.string().min(1, "symbol is required"),
  decimals: z.number().int().nonnegative(),
  totalSupply: z.string(), // string due to big numbers
  description: z.string().optional(),
  website: z.string().url().optional(),
  icon: z.string().url().optional(),
})

export type TokenInfo = z.infer<typeof TokenInfoSchema>

/**
 * response wrapper schema for list endpoints
 */
export const TokenListResponseSchema = z.object({
  tokens: z.array(TokenInfoSchema),
  count: z.number().int().nonnegative(),
})

export type TokenListResponse = z.infer<typeof TokenListResponseSchema>

// ----------------------------
// Knowledge topics
// ----------------------------

/**
 * predefined knowledge topics about tokens
 * these map to frequently referenced standards and concepts
 */
export const knowledgeTopics: string[] = [
  "ERC20 Standard",
  "SPL Token Standard (Solana)",
  "Token Metadata Program",
  "Minting and Burning",
  "Token Authorities",
  "Liquidity Pools",
  "Bridged Assets",
  "Wrapped Tokens",
]

/**
 * return the full list of knowledge topics
 */
export function getKnowledgeTopics(): string[] {
  return [...knowledgeTopics]
}

/**
 * check if a topic exists in the knowledge set
 */
export function hasKnowledgeTopic(topic: string): boolean {
  return knowledgeTopics.includes(topic)
}

// ----------------------------
// API functions
// ----------------------------

/**
 * lookup token metadata by tokenId via the core-knowledge API
 * throws on invalid format or missing data
 */
export async function lookupTokenInfo(
  tokenId: string,
  adapter: ApiAdapter
): Promise<TokenInfo> {
  const raw = await adapter.get<{ data: unknown }>(`knowledge/tokens/${tokenId}`)
  const parsed = TokenInfoSchema.safeParse(raw.data)
  if (!parsed.success) {
    throw new Error(`invalid token info format for ${tokenId}: ${parsed.error}`)
  }
  return parsed.data
}

/**
 * fetch a list of tokens from the core-knowledge API
 * supports optional pagination
 */
export async function listTokens(
  adapter: ApiAdapter,
  params?: { limit?: number; offset?: number }
): Promise<TokenListResponse> {
  const query = new URLSearchParams()
  if (params?.limit) query.append("limit", String(params.limit))
  if (params?.offset) query.append("offset", String(params.offset))

  const raw = await adapter.get<{ data: unknown }>(
    `knowledge/tokens${query.toString() ? "?" + query.toString() : ""}`
  )
  const parsed = TokenListResponseSchema.safeParse(raw.data)
  if (!parsed.success) {
    throw new Error(`invalid token list response: ${parsed.error}`)
  }
  return parsed.data
}

// ----------------------------
// Utility functions
// ----------------------------

/**
 * format supply values into human-readable numbers
 */
export function formatSupply(token: TokenInfo): string {
  const decimals = token.decimals
  const raw = BigInt(token.totalSupply)
  const divisor = BigInt(10) ** BigInt(decimals)
  const whole = raw / divisor
  const fraction = raw % divisor
  return `${whole.toString()}.${fraction.toString().padStart(decimals, "0")}`
}

/**
 * build a display label for a token
 */
export function tokenLabel(token: TokenInfo): string {
  return `${token.name} (${token.symbol})`
}

/**
 * quick filter by symbol
 */
export function filterBySymbol(tokens: TokenInfo[], symbol: string): TokenInfo[] {
  return tokens.filter((t) => t.symbol.toLowerCase() === symbol.toLowerCase())
}

// ----------------------------
// Example usage
// ----------------------------
//
// import { ApiAdapter } from "./api-adapter"
// const adapter = new ApiAdapter({ baseUrl: "https://api.core-knowledge.ai" })
// const topics = getKnowledgeTopics()
// const info = await lookupTokenInfo("So11111111111111111111111111111111111111112", adapter)
// console.log(tokenLabel(info))
// const all = await listTokens(adapter, { limit: 20 })
