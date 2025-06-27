import React, { useState } from 'react'
import { Grid } from '@/components/ui/grid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DexPairCard } from './DexPairCard'
import { DexTopPairs } from './DexTopPairs'
import { DexscreenerAdapter } from './dexscreener-adapter'

const CHAINS = ['ethereum', 'bsc', 'polygon', 'avalanche'] as const

type Chain = typeof CHAINS[number]

export const DexDashboard: React.FC = () => {
  const [address, setAddress] = useState<string>('')
  const [chain, setChain] = useState<Chain>('ethereum')
  const [showPair, setShowPair] = useState<boolean>(false)
  const adapter = new DexscreenerAdapter({ cacheTTL: 120 })

  const handleFetch = () => {
    setShowPair(address.trim().length > 0)
  }

  return (
    <div className="space-y-6">
      <Grid columns={3} gap="4">
        <div className="col-span-2 flex items-center space-x-2">
          <Input
            placeholder="Token address"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <Select value={chain} onValueChange={val => setChain(val as Chain)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent>
              {CHAINS.map(c => (
                <SelectItem key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleFetch} disabled={!address.trim()}>
            Load Pair
          </Button>
        </div>
      </Grid>

      {showPair && <DexPairCard tokenAddress={address} adapter={adapter} />}

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Top {5} Pairs on {chain[0].toUpperCase() + chain.slice(1)}
        </h2>
        <DexTopPairs chain={chain} adapter={adapter} limit={5} />
      </section>
    </div>
  )
}