import React, { useState } from 'react'
import { Grid } from '@/components/ui/grid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DexPairCard } from './DexPairCard'
import { DexTopPairs } from './DexTopPairs'
import { DexscreenerAdapter } from './dexscreener-adapter'

export const DexscreenerDashboard: React.FC = () => {
  const [address, setAddress] = useState('')
  const [chain, setChain] = useState('ethereum')
  const adapter = new DexscreenerAdapter({ cacheTTL: 120 })

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <Input
          placeholder="Token address"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
        <Button onClick={() => {}}>Fetch Pair</Button>
      </div>
      {address && <DexPairCard tokenAddress={address} adapter={adapter} />}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Top Pairs</h2>
        <div className="mt-4">
          <DexTopPairs chain={chain} adapter={adapter} />
        </div>
      </div>
    </div>
  )
}
