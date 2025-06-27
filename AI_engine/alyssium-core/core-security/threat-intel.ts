// threat-intel.ts
// Threat intelligence definitions for Alyssium Core Security module

export interface ThreatIndicator {
  id: string             // Unique identifier for the indicator
  name: string           // Human-readable name
  description: string    // Detailed description of the threat
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags?: string[]        // Categorization tags
}

// Predefined set of common threat indicators
export const threatIndicators: ThreatIndicator[] = [
  {
    id: 'suspicious-wallet-activity',
    name: 'Suspicious Wallet Activity',
    description: 'Detected unusual patterns of transfers or interactions suggesting automated or malicious behavior.',
    severity: 'high',
    tags: ['wallet', 'anomaly', 'automation']
  },
  {
    id: 'honeypot-contract',
    name: 'Honeypot Contract',
    description: 'Token contract that allows buys but blocks sell orders, trapping funds.',
    severity: 'critical',
    tags: ['contract', 'fraud']
  },
  {
    id: 'rug-pull-pattern',
    name: 'Rug Pull Pattern',
    description: 'Liquidity drained from pool shortly after launch, indicating potential exit scam.',
    severity: 'critical',
    tags: ['liquidity', 'exit-scam']
  },
  {
    id: 'flashloan-manipulation',
    name: 'Flashloan Manipulation',
    description: 'Large, short-term loans used to artificially move market prices.',
    severity: 'medium',
    tags: ['flashloan', 'market-manipulation']
  },
  {
    id: 'phishing-url-detected',
    name: 'Phishing URL Detected',
    description: 'URL matches known phishing domains or patterns targeting Solana users.',
    severity: 'medium',
    tags: ['phishing', 'url']
  },
  {
    id: 'blacklisted-address',
    name: 'Blacklisted Address',
    description: 'Address appears on threat intelligence blacklist of known malicious actors.',
    severity: 'high',
    tags: ['blacklist', 'address']
  }
]

/**
 * Retrieve all threat indicators of a given severity or higher
 */
export function getIndicatorsBySeverity(minSeverity: ThreatIndicator['severity']): ThreatIndicator[] {
  const order = ['low', 'medium', 'high', 'critical']
  const minIndex = order.indexOf(minSeverity)
  return threatIndicators.filter(ind => order.indexOf(ind.severity) >= minIndex)
}

/**
 * Find an indicator by its ID
 */
export function findIndicatorById(id: string): ThreatIndicator | undefined {
  return threatIndicators.find(ind => ind.id === id)
}
