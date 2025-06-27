// security-scanner.ts
// Security scanning tools for Alyssium Core Security module

import { ApiAdapter } from './api-adapter'
import { ThreatIndicator, threatIndicators, findIndicatorById } from './threat-intel'
import Big from 'big.js'

export interface ScanOptions {
  contractAddress?: string
  recentTxCount?: number
}

export interface ScanResult {
  indicator: ThreatIndicator
  details: string
}

/**
 * SecurityScanner integrates on-chain scans with threat intelligence
 */
export class SecurityScanner {
  private api: ApiAdapter

  constructor(apiAdapter: ApiAdapter) {
    this.api = apiAdapter
  }

  /**
   * Scan a smart contract for known vulnerabilities
   */
  async scanContract(address: string): Promise<ScanResult[]> {
    // Fetch contract metadata and code analysis report
    const report = await this.api.get<{ vulnerabilities: Array<{ id: string; info: string }> }>(
      `security/contracts/${address}`
    )

    return report.vulnerabilities.map(vuln => {
      const indicator = findIndicatorById(vuln.id) || {
        id: vuln.id,
        name: 'Unknown Vulnerability',
        description: vuln.info,
        severity: 'low'
      }
      return { indicator, details: vuln.info }
    })
  }

  /**
   * Audit recent transactions for suspicious patterns
   */
  async auditTransactions(address: string, count: number = 50): Promise<ScanResult[]> {
    const txs = await this.api.get<{ transactions: Array<{ id: string; value: string; tags?: string[] }> }>(
      `wallets/${address}/transactions?limit=${count}`
    )

    const results: ScanResult[] = []
    txs.transactions.forEach(tx => {
      const value = new Big(tx.value)
      if (value.gt(10000)) {
        const indicator = threatIndicators.find(ind => ind.id === 'suspicious-wallet-activity')!
        results.push({ indicator, details: `High-value tx ${tx.id}: ${value.toFixed()}` })
      }
      if (tx.tags?.includes('flashloan')) {
        const indicator = threatIndicators.find(ind => ind.id === 'flashloan-manipulation')!
        results.push({ indicator, details: `Flashloan tag in tx ${tx.id}` })
      }
    })
    return results
  }

  /**
   * Run a comprehensive security check combining contract and tx scans
   */
  async fullSecurityAudit(
    contractAddress: string,
    walletAddress: string,
    options?: ScanOptions
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = []
    // Contract scan
    const contractResults = await this.scanContract(contractAddress)
    results.push(...contractResults)

    // Transaction audit
    const txResults = await this.auditTransactions(
      walletAddress,
      options?.recentTxCount
    )
    results.push(...txResults)

    return results
  }
}