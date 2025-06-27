import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PublicKey } from '@solana/web3.js'

export interface TokenInfoProps {
  name: string
  symbol: string
  riskLevel: 'low' | 'moderate' | 'high'
  onRefresh?: () => void
}

export const TokenInfoCard: React.FC<TokenInfoProps> = ({ name, symbol, riskLevel, onRefresh }) => {
  const riskColor = riskLevel === 'low' ? 'text-green-400' : riskLevel === 'moderate' ? 'text-yellow-400' : 'text-red-400'

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Token Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Symbol</p>
            <p className="font-medium">{symbol}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Risk Level</p>
          <p className={`font-bold ${riskColor}`}>{riskLevel.toUpperCase()}</p>
        </div>
        {onRefresh && (
          <Button size="sm" variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export interface AnalyticsChartProps {
  data: Array<{ time: string; value: number }>
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data }) => (
  <Card className="p-4">
    <CardHeader>
      <CardTitle className="text-lg font-semibold">Market Analytics</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={value => `$${value}`} />
          <Tooltip formatter={value => `$${value}`} />
          <Line type="monotone" dataKey="value" stroke="#1BE8A5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#0e0e1f] text-[#e0e0e0] p-6">
    <header className="mb-6 flex justify-between items-center">
      <h1 className="text-2xl font-semibold">Alyssium Dashboard</h1>
      <nav>
        <ul className="flex space-x-4">
          <li><a href="#overview" className="hover:text-white">Overview</a></li>
          <li><a href="#token-info" className="hover:text-white">Token Info</a></li>
          <li><a href="#analytics" className="hover:text-white">Analytics</a></li>
        </ul>
      </nav>
    </header>
    <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">{children}</main>
  </div>
)
