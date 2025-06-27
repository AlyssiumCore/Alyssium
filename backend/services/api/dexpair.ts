import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DexscreenerAdapter } from './dexscreener-adapter'

export interface DexPairCardProps {
  tokenAddress: string
  adapter: DexscreenerAdapter
}

export const DexPairCard: React.FC<DexPairCardProps> = ({ tokenAddress, adapter }) => {
  const [loading, setLoading] = useState(false)
  const [pairInfo, setPairInfo] = useState<{
    pair: string
    price: number
    priceChange24h: number
    volume24h: number
    liquidity: number
  } | null>(null)

  const fetchPair = async () => {
    setLoading(true)
    try {
      const info = await adapter.fetchPair(tokenAddress)
      setPairInfo(info)
    } catch {
      setPairInfo(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tokenAddress) fetchPair()
  }, [tokenAddress])

  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>DEX Pair Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div><strong>Pair:</strong> {pairInfo?.pair || '-'}</div>
        <div><strong>Price:</strong> ${pairInfo?.price.toFixed(4) || '-'}</div>
        <div>
          <strong>24h Change:</strong>{' '}
          <span className={pairInfo && pairInfo.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}>
            {pairInfo ? `${pairInfo.priceChange24h.toFixed(2)}%` : '-'}
          </span>
        </div>
        <div><strong>24h Volume:</strong> ${pairInfo?.volume24h.toLocaleString() || '-'}</div>
        <div><strong>Liquidity:</strong> ${pairInfo?.liquidity.toLocaleString() || '-'}</div>
        <Button onClick={fetchPair} disabled={loading || !tokenAddress}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </CardContent>
    </Card>
  )
}
