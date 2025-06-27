import { Logger } from './logger'
import { MetricsReporter } from './metrics-reporter'
import { AlertManager } from './alert-manager'

export type ScheduledTask = {
  name: string
  fn: () => Promise<void>
  intervalMs: number
  retryCount: number
  retryDelayMs: number
}

export class TaskScheduler {
  private tasks: Map<string, NodeJS.Timeout> = new Map()
  private logger = new Logger({ level: 'info' })
  private metrics = new MetricsReporter()
  private alertManager: AlertManager

  constructor(alertManager: AlertManager) {
    this.alertManager = alertManager
  }

  register(task: ScheduledTask) {
    const run = async () => {
      const start = Date.now()
      try {
        await task.fn()
        const duration = (Date.now() - start) / 1000
        this.metrics.recordTaskDuration(task.name, duration)
      } catch (err) {
        this.logger.error(`${task.name} failed: ${err}`)
        await this.alertManager.sendAlert(
          `${task.name} error`,
          String(err)
        )
      }
    }
    run()
    const handle = setInterval(run, task.intervalMs)
    this.tasks.set(task.name, handle)
  }

  unregister(name: string) {
    const handle = this.tasks.get(name)
    if (handle) {
      clearInterval(handle)
      this.tasks.delete(name)
    }
  }

  shutdown() {
    for (const handle of this.tasks.values()) {
      clearInterval(handle)
    }
    this.tasks.clear()
    this.logger.info('TaskScheduler shutdown')
  }
}