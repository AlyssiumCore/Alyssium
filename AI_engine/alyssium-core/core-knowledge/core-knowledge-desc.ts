
export const CoreKnowledgeDesc = {
  moduleId: 'core-knowledge',
  version: '1.0.0',
  author: 'Alyssium Team',
  description: `
    The Core Knowledge module aggregates on-chain reference data,
    including token standards, network parameters, and common
    protocol patterns. It serves as the basis for AI-driven insights
    and detailed blockchain explanations.
  `.trim(),
  features: [
    'Token metadata schema definitions',
    'On-chain program documentation lookup',
    'Network parameter listings',
    'Protocol examples and code snippets'
  ],
  endpoints: {
    tokenInfo: '/knowledge/tokens/:tokenId',
    networkStatus: '/knowledge/network/status',
    protocolDocs: '/knowledge/protocols/:protocolId'
  }
}

// alert-manager.ts
// Notification and alerting utility for Alyssium Core

import { Logger } from './logger'
import nodemailer from 'nodemailer'

export interface AlertOptions {
  email?: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
    to: string[]
  }
  slackWebhookUrl?: string
}

export class AlertManager {
  private logger: Logger
  private emailTransporter?: nodemailer.Transporter
  private slackWebhookUrl?: string

  constructor(private options: AlertOptions) {
    this.logger = new Logger({ level: 'warn' })

    if (options.email) {
      this.emailTransporter = nodemailer.createTransport({
        host: options.email.host,
        port: options.email.port,
        secure: options.email.secure,
        auth: {
          user: options.email.user,
          pass: options.email.pass
        }
      })
      this.slackWebhookUrl = options.slackWebhookUrl
    }
  }

  /**
   * Send an alert via configured channels
   */
  async sendAlert(subject: string, message: string): Promise<void> {
    this.logger.warn(`ALERT: ${subject}`)

    if (this.emailTransporter && this.options.email) {
      try {
        await this.emailTransporter.sendMail({
          from: this.options.email.from,
          to: this.options.email.to.join(','),
          subject,
          text: message
        })
        this.logger.info('Email alert sent')
      } catch (err) {
        this.logger.error(`Failed to send email alert: ${err}`)
      }
    }

    if (this.slackWebhookUrl) {
      try {
        await fetch(this.slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `*${subject}*\n${message}` })
        })
        this.logger.info('Slack alert sent')
      } catch (err) {
        this.logger.error(`Failed to send Slack alert: ${err}`)
      }
    }
  }
}
