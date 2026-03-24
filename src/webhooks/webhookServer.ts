/**
 * Express webhook server with HMAC signature verification
 * Handles incoming webhooks from external services (TipLink, Discord, etc)
 */

import express, { Router, Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import log from 'electron-log/main'
import { WebhookConfig, WebhookResponse } from './webhookConfig'

export class WebhookServer {
  private app: express.Application
  private server: any = null
  private failedAttempts = new Map<string, number>()
  private readonly RATE_LIMIT_THRESHOLD = 5 // Max failed attempts
  private readonly RATE_LIMIT_WINDOW = 60000 // 1 minute

  constructor(
    private config: WebhookConfig,
    private logger = log
  ) {
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Capture raw body for signature verification
    this.app.use(
      express.json({
        verify: (req: any, _res: Response, buf: Buffer) => {
          req.rawBody = buf.toString('utf8')
        }
      })
    )

    // HMAC signature verification middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      // Skip verification for health/heartbeat endpoints
      if (req.path === '/health' || req.path === '/heartbeat') {
        return next()
      }

      const clientIp = this.getClientIp(req)

      // Rate limit check
      if (this.config.enableRateLimit !== false) {
        const attempts = this.failedAttempts.get(clientIp) || 0
        if (attempts >= this.RATE_LIMIT_THRESHOLD) {
          this.logger.warn(
            `[Webhook] Rate limited: ${clientIp} (${attempts}/${this.RATE_LIMIT_THRESHOLD} attempts)`
          )
          return res.status(429).json({
            status: 'error',
            message: 'Too many failed attempts. Try again later.'
          } as WebhookResponse)
        }
      }

      // Verify HMAC signature
      const signature = req.headers['x-signature'] as string | undefined
      const rawBody = (req as any).rawBody || JSON.stringify(req.body)

      if (!signature) {
        this.recordFailedAttempt(clientIp)
        return res.status(401).json({
          status: 'error',
          message: 'Missing X-Signature header'
        } as WebhookResponse)
      }

      const [algorithm, providedHash] = signature.split('=')
      if (algorithm !== 'sha256') {
        this.recordFailedAttempt(clientIp)
        return res.status(401).json({
          status: 'error',
          message: 'Unsupported signature algorithm. Use sha256=...'
        } as WebhookResponse)
      }

      // Compute and verify signature using constant-time comparison
      const secret = this.config.secretProvider()

      if (!secret) {
        this.logger.error('[Webhook] Secret provider returned empty value')
        return res.status(500).json({
          status: 'error',
          message: 'Server not configured for signature verification'
        } as WebhookResponse)
      }

      const computedHash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

      try {
        if (!crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(computedHash))) {
          this.recordFailedAttempt(clientIp)
          return res.status(401).json({
            status: 'error',
            message: 'Signature verification failed'
          } as WebhookResponse)
        }
      } catch {
        this.recordFailedAttempt(clientIp)
        return res.status(401).json({
          status: 'error',
          message: 'Signature verification failed'
        } as WebhookResponse)
      }

      // Signature verified - clear failed attempts
      this.failedAttempts.delete(clientIp)
      next()
    })

    // Logging middleware
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      this.logger.debug(`[Webhook] ${req.method} ${req.path}`)
      next()
    })
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    const router = Router()

    // Health check - no signature required
    router.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: Date.now()
      })
    })

    // Generic heartbeat endpoint
    router.post('/heartbeat', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        message: 'Heartbeat received',
        timestamp: Date.now()
      })
    })

    this.app.use('/webhooks', router)
  }

  /**
   * Register a webhook handler for a specific source
   * Example: registerWebhook('tiplink', (data) => { ... })
   */
  registerWebhook(source: string, handler: (data: unknown) => Promise<void> | void): void {
    this.app.post(`/webhooks/${source}`, async (req: Request, res: Response) => {
      try {
        await handler(req.body)

        res.status(202).json({
          status: 'ok',
          message: 'Event received and queued for processing'
        } as WebhookResponse)

        this.logger.info(`[Webhook] ${source} event processed`)
      } catch (error) {
        this.logger.error(`[Webhook] Error processing ${source} event:`, error)
        res.status(400).json({
          status: 'error',
          message: 'Failed to process event',
          details: error instanceof Error ? error.message : 'Unknown error'
        } as WebhookResponse)
      }
    })
  }

  /**
   * Start the webhook server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, '0.0.0.0', () => {
          this.logger.info(`✓ Webhook server started on port ${this.config.port}`)
          this.logger.info(
            `  - Health check: GET http://0.0.0.0:${this.config.port}/webhooks/health`
          )
          this.logger.info(`  - Register webhooks with: registerWebhook('source', handler)`)
          resolve()
        })
      } catch (error) {
        this.logger.error('Failed to start webhook server:', error)
        reject(error)
      }
    })
  }

  /**
   * Stop the webhook server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('✓ Webhook server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * Helper: Get client IP from request
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0] || req.ip || 'unknown'
    )
  }

  /**
   * Track failed authentication attempts for rate limiting
   */
  private recordFailedAttempt(clientIp: string): void {
    const current = this.failedAttempts.get(clientIp) || 0
    this.failedAttempts.set(clientIp, current + 1)

    // Reset counter after timeout
    setTimeout(() => {
      this.failedAttempts.delete(clientIp)
    }, this.RATE_LIMIT_WINDOW)
  }
}
