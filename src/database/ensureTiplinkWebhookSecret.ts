import Database from 'better-sqlite3'
import { Logger } from 'electron-log'
import crypto from 'crypto'
import { getTiplinkWebhookSecret } from './getTiplinkWebhookSecret'
import { setTiplinkWebhookSecret } from './setTiplinkWebhookSecret'

export function ensureTiplinkWebhookSecret(db: Database, log: Logger): string {
  const existing = getTiplinkWebhookSecret(db, log)

  if (existing) {
    return existing
  }

  const generatedSecret = crypto.randomBytes(32).toString('hex')
  const ok = setTiplinkWebhookSecret(db, generatedSecret, log)

  if (!ok) {
    log.error('Failed to persist generated TipLink webhook secret')
    return ''
  }

  log.info('Generated TipLink webhook secret for this installation')
  return generatedSecret
}
