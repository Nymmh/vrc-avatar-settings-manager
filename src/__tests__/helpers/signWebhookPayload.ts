import crypto from 'crypto'

export function signWebhookPayload(payload: unknown, secret: string): string {
  const rawBody = JSON.stringify(payload)
  const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return `sha256=${signature}`
}
