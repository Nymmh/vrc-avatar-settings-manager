/**
 * Express webhook server with HMAC signature verification
 * Handles incoming webhooks from external services (TipLink, Discord, etc)
 */

import express, { Router, Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { Server } from 'http'
import log from 'electron-log/main'
import { WebhookConfig, WebhookResponse, WebhookRouteResult } from './webhookConfig'

interface RawBodyRequest extends Request {
  rawBody?: string
}

type SignedRouteHandler = (
  data: unknown,
  req: Request
) => Promise<WebhookRouteResult> | WebhookRouteResult

export class WebhookServer {
  private app: express.Application
  private server: Server | null = null
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
        verify: (req, _res: Response, buf: Buffer) => {
          ;(req as RawBodyRequest).rawBody = buf.toString('utf8')
        }
      })
    )

    // HMAC signature verification middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      // Skip verification for health/heartbeat endpoints
      if (req.path === '/webhooks/health' || req.path === '/webhooks/heartbeat') {
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
            success: false,
            msg: 'Too many failed attempts. Try again later.'
          } as WebhookResponse)
        }
      }

      // Verify HMAC signature
      const signatureHeader = req.headers['asm-signature'] ?? req.get('ASM-Signature')
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader
      const rawBody = (req as RawBodyRequest).rawBody || JSON.stringify(req.body)

      if (!signature) {
        this.recordFailedAttempt(clientIp)
        this.logger.warn(`[Webhook] Missing signature from ${clientIp}`)
        return res.status(401).json({
          success: false,
          msg: 'Missing ASM-Signature header'
        } as WebhookResponse)
      }

      const [algorithm, providedHash] = signature.split('=')
      if (algorithm !== 'sha256') {
        this.recordFailedAttempt(clientIp)
        this.logger.warn(`[Webhook] Unsupported signature algorithm from ${clientIp}: ${algorithm}`)
        return res.status(401).json({
          success: false,
          msg: 'Unsupported signature algorithm. Use sha256=...'
        } as WebhookResponse)
      }

      // Compute and verify signature using constant-time comparison
      const secrets = this.config.secretProvider().filter((secret) => secret.length > 0)

      if (secrets.length === 0) {
        this.logger.error('[Webhook] Secret provider returned empty value')
        return res.status(500).json({
          success: false,
          msg: 'Server not configured for signature verification'
        } as WebhookResponse)
      }

      if (!providedHash) {
        this.recordFailedAttempt(clientIp)
        this.logger.warn(`[Webhook] Missing hash from ${clientIp}`)
        return res.status(401).json({
          success: false,
          msg: 'Signature verification failed'
        } as WebhookResponse)
      }

      try {
        const isValidSignature = secrets.some((secret) => {
          const computedHash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
          return crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(computedHash))
        })

        if (!isValidSignature) {
          this.recordFailedAttempt(clientIp)
          return res.status(401).json({
            success: false,
            msg: 'Signature verification failed'
          } as WebhookResponse)
        }
      } catch {
        this.recordFailedAttempt(clientIp)
        this.logger.warn(`[Webhook] Error verifying signature from ${clientIp}`)
        return res.status(401).json({
          success: false,
          msg: 'Signature verification failed'
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
        success: true,
        msg: 'Webhook server is healthy',
        data: {
          timestamp: Date.now()
        }
      })
    })

    // Heartbeat endpoint
    router.post('/heartbeat', (_req: Request, res: Response) => {
      res.json({
        success: true,
        msg: 'Heartbeat received',
        data: {
          timestamp: Date.now()
        }
      })
    })

    this.app.use('/webhooks', router)
  }

  /**
   * Register a webhook handler for a specific source
   */
  registerSignedRoute(routePath: string, handler: SignedRouteHandler): void {
    this.app.post(`/webhooks/${routePath}`, async (req: Request, res: Response) => {
      try {
        const result = await handler(req.body, req)

        res.status(result.statusCode ?? 200).json({
          success: result.success,
          msg: result.msg,
          data: result.data
        } as WebhookResponse)

        this.logger.info(`[Webhook] ${routePath} route handled`)
      } catch (error) {
        this.logger.error(`[Webhook] Error processing ${routePath} route:`, error)
        res.status(400).json({
          success: false,
          msg: error instanceof Error ? error.message : 'Unknown error'
        } as WebhookResponse)
      }
    })
  }

  registerWebhook(source: string, handler: (data: unknown) => Promise<void> | void): void {
    this.registerSignedRoute(source, async (data: unknown) => {
      await handler(data)
      return {
        success: true,
        msg: 'Event received and queued for processing',
        statusCode: 202
      }
    })
  }

  getApp(): express.Application {
    return this.app
  }

  /**
   * Start the webhook server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, '0.0.0.0', () => {
          this.logger.info(`Webhook server started on port ${this.config.port}`)
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
          this.logger.info('Webhook server stopped')
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
