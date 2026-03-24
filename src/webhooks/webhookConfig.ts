/**
 * Webhook configuration and types
 */

export interface WebhookConfig {
  port: number
  secretProvider: () => string // Shared secret for HMAC signing (resolved at request time)
  enableRateLimit?: boolean
}

export interface TiplinkEvent {
  userId: string
  action: string
  value?: unknown
  message?: string
  metadata?: Record<string, unknown>
  timestamp?: number
}

export interface WebhookResponse {
  status: 'ok' | 'error'
  message: string
  details?: unknown
}
