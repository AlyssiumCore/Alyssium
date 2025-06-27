// health-monitor.ts
// Periodic health check and monitoring utility for Alyssium Core

import { ApiAdapter } from './api-adapter'
import { Logger } from './logger'

export interface MonitorOptions {
  services: Record<string, ApiAdapter>
  intervalMs?: number
  timeoutMs?: number
}

interface ServiceStatus {
  serviceKey: string
  healthy: boolean
  latencyMs: number
}

export class HealthMonitor {
  private services: Record<string, ApiAdapter>
  private intervalMs: number
  private timeoutMs: number
  private logger: Logger
  private timer?: NodeJS.Timeout

  constructor(options: MonitorOptions) {
    this.services = options.services
    this.intervalMs = options.intervalMs ?? 60000 // default 1 minute
    this.timeoutMs = options.timeoutMs ?? 5000     // default 5 seconds
    this.logger = new Logger({ level: 'info' })
  }

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.timer) return
    this.logger.info('Health monitor started')
    this.timer = setInterval(() => this.checkAll(), this.intervalMs)
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
    this.logger.info('Health monitor stopped')
  }

  /**
   * Perform health check for all services
   */
  private async checkAll(): Promise<void> {
    const results: ServiceStatus[] = []
    for (const [key, adapter] of Object.entries(this.services)) {
      try {
        const start = Date.now()
        // perform a lightweight GET to root or health endpoint
        await adapter.request<any>(`${adapter['baseUrl']}/health`, { method: 'GET', timeout: this.timeoutMs })
        const latency = Date.now() - start
        results.push({ serviceKey: key, healthy: true, latencyMs: latency })
        this.logger.info(`Service ${key} healthy, latency ${latency}ms`)
      } catch (err) {
        this.logger.error(`Service ${key} health check failed: ${err}`)
        results.push({ serviceKey: key, healthy: false, latencyMs: this.timeoutMs })
      }
    }
    // Further processing or alerting can be done here
  }
}
