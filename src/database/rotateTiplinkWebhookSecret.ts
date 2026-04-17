import Database from 'better-sqlite3'
import { Logger } from 'electron-log'
import crypto from 'crypto'
import {
  getTiplinkWebhookSecretState,
  TIPLINK_SECRET_ROTATION_WINDOW_MS,
  TiplinkWebhookSecretState
} from './getTiplinkWebhookSecretState'

export interface RotateTiplinkWebhookSecretResult {
  secret: string
  previousSecretExpiresAt: number | null
}

export function rotateTiplinkWebhookSecret(
  db: Database,
  log: Logger,
  now = Date.now()
): RotateTiplinkWebhookSecretResult | null {
  try {
    const secretState = getTiplinkWebhookSecretState(db, log)
    const nextSecret = crypto.randomBytes(32).toString('hex')
    const previousSecretExpiresAt = secretState.currentSecret
      ? now + TIPLINK_SECRET_ROTATION_WINDOW_MS
      : null

    const setSetting = db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )

    db.transaction(() => {
      setSetting.run('tiplinkWebhookSecret', nextSecret)
      setSetting.run('tiplinkWebhookPreviousSecret', secretState.currentSecret)
      setSetting.run(
        'tiplinkWebhookPreviousSecretExpiresAt',
        previousSecretExpiresAt !== null ? String(previousSecretExpiresAt) : ''
      )
    })()

    return {
      secret: nextSecret,
      previousSecretExpiresAt
    }
  } catch (e) {
    log.error('Error rotating TipLink webhook secret', e)
    return null
  }
}

export function clearExpiredTiplinkWebhookSecret(
  db: Database,
  log: Logger,
  state: TiplinkWebhookSecretState,
  now = Date.now()
): boolean {
  try {
    if (
      !state.previousSecret ||
      state.previousSecretExpiresAt === null ||
      state.previousSecretExpiresAt > now
    ) {
      return false
    }

    const setSetting = db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )

    db.transaction(() => {
      setSetting.run('tiplinkWebhookPreviousSecret', '')
      setSetting.run('tiplinkWebhookPreviousSecretExpiresAt', '')
    })()

    return true
  } catch (e) {
    log.error('Error clearing expired TipLink webhook previous secret', e)
    return false
  }
}
