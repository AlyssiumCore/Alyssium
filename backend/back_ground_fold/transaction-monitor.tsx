import { ApiAdapter } from './api-adapter'
import { MetricsReporter } from './metrics-reporter'
import { Logger } from './logger'

export class TransactionMonitor {
  private api: ApiAdapter
  private metrics: MetricsReporter
  private logger: Logger

  constructor(api: ApiAdapter, metrics: MetricsReporter, logger: Logger) {
    this.api = api
    this.metrics = metrics
    this.logger = logger
  }

  async monitor(address: string, limit = 100) {
    const startTime = Date.now()
    const data = await this.api.get<{ transactions: Array<{ id: string; value: number }> }>(`wallets/${address}/transactions?limit=${limit}`)
    const duration = (Date.now() - startTime) / 1000
    this.metrics.recordTaskDuration('transactionMonitor', duration)
    const highValue = data.transactions.filter(tx => tx.value > 10000)
    this.metrics.updateAnomalyCount('transactionMonitor', highValue.length)
    if (highValue.length) {
      this.logger.warn(`High-value transactions: ${highValue.length}`)
    }
    return data.transactions
  }
}
