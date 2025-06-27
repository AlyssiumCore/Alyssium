// webhook-handler.ts
// Webhook handling logic for Alyssium Core

import { CacheManager } from './cache-manager'
import { ApiAdapter } from './api-adapter'
import express, { Request, Response } from 'express'

export interface WebhookHandlerOptions {
  secret?: string              // Optional secret for signature verification
  cacheTTL?: number            // Cache TTL for duplicate prevention
  externalServiceBaseUrl: string
}

export class WebhookHandler {
  private cache: CacheManager
  private api: ApiAdapter
  private secret?: string

  constructor(private options: WebhookHandlerOptions) {
    this.cache = new CacheManager({ ttlSeconds: options.cacheTTL })
    this.api = new ApiAdapter({ baseUrl: options.externalServiceBaseUrl })
    this.secret = options.secret
  }

  /**
   * Verify webhook payload signature if secret is provided
   */
  verifySignature(req: Request): boolean {
    if (!this.secret) return true
    const signature = req.headers['x-webhook-signature'] as string
    // Simplified HMAC verification placeholder
    const expected = this.secret // implement real HMAC check here
    return signature === expected
  }

  /**
   * Handle incoming webhook, prevent duplicates, and forward to service
   */
  async handle(req: Request, res: Response): Promise<void> {
    if (!this.verifySignature(req)) {
      res.status(401).send({ error: 'Invalid signature' })
      return
    }

    const eventId = req.body.id as string
    const cacheKey = `webhook:${eventId}`
    if (this.cache.get(cacheKey)) {
      res.status(200).send({ status: 'duplicate' })
      return
    }

    // Mark event as processed
    this.cache.set(cacheKey, true)

    try {
      // Forward payload to external service
      const result = await this.api.post('/webhook/process', req.body)
      res.status(200).send({ status: 'processed', result })
    } catch (err) {
      console.error('Webhook forwarding error', err)
      res.status(500).send({ error: 'Processing failed' })
    }
  }

  /**
   * Register webhook endpoint on an Express app
   */
  registerRoutes(app: express.Application, path: string = '/webhook') {
    app.post(path, express.json(), (req, res) => {
      this.handle(req, res)
    })
  }
}
