// metrics-reporter.ts
// Metrics collection and reporting utility for Alyssium Core

import client from 'prom-client'
import { Logger } from './logger'

// Create a Registry which registers the metrics
const register = new client.Registry()
client.collectDefaultMetrics({ register })

// Define custom metrics
export const taskDurationHistogram = new client.Histogram({
  name: 'alyssium_task_duration_seconds',
  help: 'Histogram of task execution durations in seconds',
  labelNames: ['task'] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10]
})

export const anomalyCountGauge = new client.Gauge({
  name: 'alyssium_anomaly_count',
  help: 'Gauge of anomalies detected per run',
  labelNames: ['module'] as const
})

register.registerMetric(taskDurationHistogram)
register.registerMetric(anomalyCountGauge)

export class MetricsReporter {
  private logger = new Logger({ level: 'debug' })

  /**
   * Record duration for a given task
   */
  recordTaskDuration(taskName: string, durationSec: number): void {
    taskDurationHistogram.labels(taskName).observe(durationSec)
    this.logger.debug(`Task ${taskName} took ${durationSec}s`)
  }

  /**
   * Update anomaly count gauge
   */
  updateAnomalyCount(moduleName: string, count: number): void {
    anomalyCountGauge.labels(moduleName).set(count)
    this.logger.debug(`Anomaly count for ${moduleName}: ${count}`)
  }

  /**
   * Expose metrics endpoint for Prometheus
   */
  async metricsEndpoint(req: any, res: any): Promise<void> {
    try {
      const metrics = await register.metrics()
      res.set('Content-Type', register.contentType)
      res.send(metrics)
    } catch (err) {
      this.logger.error(`Failed to collect metrics: ${err}`)
      res.status(500).send('Error collecting metrics')
    }
  }
}
