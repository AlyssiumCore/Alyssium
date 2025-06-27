export interface LiquidityCapability {
  id: string                // unique capability identifier
  name: string              // human-readable name
  description: string       // detailed description of the capability
  parameters?: Record<string, any> // optional default parameters
}

export const liquidityCapabilities: LiquidityCapability[] = [
  {
    id: 'monitorLiquidity',
    name: 'Monitor Liquidity Pools',
    description: 'Continuously track on-chain liquidity levels across configured pools and alert on significant changes.',
    parameters: { thresholdPercent: 5 }
  },
  {
    id: 'optimizeLiquidity',
    name: 'Optimize Liquidity Distribution',
    description: 'Rebalance vault positions to maximize yield and reduce slippage based on pool performance metrics.',
    parameters: { maxSlippage: 0.005 }
  },
  {
    id: 'vaultSnapshot',
    name: 'Vault State Snapshot',
    description: 'Generate point-in-time snapshots of vault assets and exposures for auditing and reporting.',
    parameters: { includeRiskMetrics: true }
  },
  {
    id: 'liquiditySimulation',
    name: 'Liquidity Impact Simulation',
    description: 'Simulate the impact of deposits or withdrawals on pool prices and vault value.',
    parameters: { simulatePercentage: 10 }
  },
  {
    id: 'autoLock',
    name: 'Auto-Lock LP Tokens',
    description: 'Automatically lock earned liquidity provider tokens for a configurable duration to incentivize long-term participation.',
    parameters: { lockDurationDays: 7 }
  }
]

// Example usage:
// import { liquidityCapabilities } from './liquidity-capabilities'
// liquidityCapabilities.forEach(cap => console.log(cap.id, cap.name));
