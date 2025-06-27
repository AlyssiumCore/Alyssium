import Big from 'big.js'

export interface PoolInfo {
  reserveA: Big
  reserveB: Big
  totalSupply: Big
}

export interface SwapResult {
  amountOut: Big
  priceImpact: number  // percentage
}

/**
 * Calculate the amount of output tokens received for a given input amount
 * using constant product formula: x * y = k
 */
export function calculateSwap(
  amountIn: Big,
  pool: PoolInfo,
  feePercent: number = 0.3
): SwapResult {
  const feeFactor = Big(1).minus(Big(feePercent).div(100))
  const amountInAfterFee = amountIn.times(feeFactor)

  const x = pool.reserveA
  const y = pool.reserveB
  const k = x.times(y)

  const newX = x.plus(amountInAfterFee)
  const newY = k.div(newX)
  const amountOut = y.minus(newY)

  // Price impact calculation
  const midPrice = y.div(x)
  const executionPrice = amountInAfterFee.div(amountOut)
  const priceImpact = midPrice.minus(executionPrice).div(midPrice).abs().times(100).toNumber()

  return { amountOut, priceImpact }
}

/**
 * Estimate slippage for a potential swap without executing it
 */
export function estimateSlippage(
  amountIn: Big,
  pool: PoolInfo
): number {
  const result = calculateSwap(amountIn, pool)
  return result.priceImpact
}

/**
 * Simulate deposit into liquidity pool: calculate LP tokens minted
 * based on proportional share
 */
export function simulateDeposit(
  amountA: Big,
  amountB: Big,
  pool: PoolInfo
): Big {
  if (pool.totalSupply.eq(0)) {
    // Initial liquidity: mint sqrt(amountA * amountB)
    return amountA.times(amountB).sqrt()
  }
  const shareA = amountA.div(pool.reserveA)
  const shareB = amountB.div(pool.reserveB)
  const share = Big.min(shareA, shareB)
  return share.times(pool.totalSupply)
}

/**
 * Simulate withdrawal from liquidity pool: calculate underlying tokens returned
 */
export function simulateWithdrawal(
  lpTokens: Big,
  pool: PoolInfo
): { amountA: Big; amountB: Big } {
  const share = lpTokens.div(pool.totalSupply)
  const amountA = share.times(pool.reserveA)
  const amountB = share.times(pool.reserveB)
  return { amountA, amountB }
}
