/**
 * Webhook configuration and types
 */

export interface WebhookConfig {
  port: number
  secretProvider: () => string[] // Shared secrets for HMAC signing (resolved at request time)
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
  success: boolean
  msg: string
  data?: unknown
}

export interface WebhookRouteResult extends WebhookResponse {
  statusCode?: number
}
