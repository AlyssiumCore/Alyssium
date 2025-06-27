// swap-guide.ts
// Swap Assistant Guide for Alyssium Core Trading module

/**
 * SwapAssistant provides a set of steps and utilities
 * to guide users through executing token swaps on Solana.
 */
export class SwapAssistant {
  /**
   * Generate step-by-step instructions for a swap
   * @param fromToken Symbol of the token to swap from
   * @param toToken Symbol of the token to swap to
   * @param amount Amount of fromToken to swap
   */
  static generateInstructions(
    fromToken: string,
    toToken: string,
    amount: number
  ): string[] {
    return [
      `1. Connect your wallet to Alyssium Core trading interface`,
      `2. Select the market pair ${fromToken}/${toToken}`,
      `3. Enter amount: ${amount} ${fromToken}`,
      `4. Review estimated output and fees`,
      `5. Confirm slippage tolerance (recommended 0.5%)`,
      `6. Submit the swap transaction on Solana network`,
      `7. Wait for confirmation and verify receipt of ${toToken}`
    ]
  }

  /**
   * Validate slippage setting and provide recommendations
   * @param slippagePercent Desired slippage tolerance
   */
  static validateSlippage(slippagePercent: number): string {
    if (slippagePercent < 0.1) {
      return 'Slippage too low; transaction may fail under volatile conditions.'
    }
    if (slippagePercent > 1) {
      return 'Slippage high; you may incur significant price impact.'
    }
    return 'Slippage tolerance set to optimal range.'
  }

  /**
   * Format a user-friendly summary after swap execution
   * @param fromToken Token swapped from
   * @param toToken Token swapped to
   * @param amountIn Amount of fromToken
   * @param amountOut Amount of toToken received
   * @param fee Solana network fee paid
   */
  static formatSummary(
    fromToken: string,
    toToken: string,
    amountIn: number,
    amountOut: number,
    fee: number
  ): string {
    return [
      `Swap Summary:`,
      `• From: ${amountIn} ${fromToken}`,
      `• To: ${amountOut.toFixed(6)} ${toToken}`,
      `• Network Fee: ${fee} SOL`,
      `• Executed at: ${new Date().toLocaleString()}`
    ].join('\n')
  }
}

// Example usage:
// import { SwapAssistant } from './swap-guide'
// const steps = SwapAssistant.generateInstructions('SOL', 'USDC', 1)
// steps.forEach(step => console.log(step))
