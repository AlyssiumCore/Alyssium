import React, { useState, useMemo } from 'react'
import { Grid } from '@/components/ui/grid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DexscreenerAdapter } from './dexscreener-adapter'
import { DexPairCard } from './DexPairCard'

export const SolanaDashboard: React.FC = () => {
  const [tokenAddress, setTokenAddress] = useState<string>('')
  const [pairInfoVisible, setPairInfoVisible] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const adapter = useMemo(
    () => new DexscreenerAdapter({ baseUrl: 'https://api.dexscreener.io/latest/dex/solana', cacheTTL: 60 }),
    []
  )

  const handleLoadPair = async () => {
    if (!tokenAddress.trim()) return
    setLoading(true)
    setPairInfoVisible(false)
    try {
      const info = await adapter.fetchPair(tokenAddress.trim())
      if (info) {
        setPairInfoVisible(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Grid columns={2} gap="4">
        <Input
          placeholder="Token address on Solana"
          value={tokenAddress}
          onChange={e => setTokenAddress(e.target.value)}
        />
        <Button onClick={handleLoadPair} disabled={!tokenAddress.trim() || loading}>
          {loading ? 'Loading...' : 'Load Pair'}
        </Button>
      </Grid>

      {pairInfoVisible && (
        <DexPairCard tokenAddress={tokenAddress} adapter={adapter} />
      )}
    </div>
  )
}
