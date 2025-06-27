// logger.ts
// Structured logging utility for Alyssium Core

import * as fs from 'fs'
import * as path from 'path'
import { format } from 'date-fns'

export interface LoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error'
  logfile?: string
}

const levels = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = typeof levels[number]

export class Logger {
  private level: LogLevel
  private logfilePath?: string

  constructor(options?: LoggerOptions) {
    this.level = options?.level ?? 'info'
    if (options?.logfile) {
      this.logfilePath = path.resolve(options.logfile)
      // ensure logfile directory exists
      fs.mkdirSync(path.dirname(this.logfilePath), { recursive: true })
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  private write(level: LogLevel, message: string): void {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    const logLine = `${timestamp} [${level.toUpperCase()}] ${message}`
    console.log(logLine)
    if (this.logfilePath) {
      fs.appendFileSync(this.logfilePath, logLine + '\n')
    }
  }

  debug(msg: string): void {
    if (this.shouldLog('debug')) this.write('debug', msg)
  }

  info(msg: string): void {
    if (this.shouldLog('info')) this.write('info', msg)
  }

  warn(msg: string): void {
    if (this.shouldLog('warn')) this.write('warn', msg)
  }

  error(msg: string): void {
    if (this.shouldLog('error')) this.write('error', msg)
  }
}

// Example usage:
// const logger = new Logger({ level: 'debug', logfile: './logs/alyssium.log' })
// logger.info('Application started')
// logger.error('Failed to connect to DB')