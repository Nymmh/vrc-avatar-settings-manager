import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export const TIPLINK_SECRET_ROTATION_WINDOW_MS = 5 * 60 * 1000

export interface TiplinkWebhookSecretState {
  currentSecret: string
  previousSecret: string
  previousSecretExpiresAt: number | null
}

function getSettingValue(db: Database, key: string): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined

  return row?.value ?? ''
}

export function getTiplinkWebhookSecretState(db: Database, log: Logger): TiplinkWebhookSecretState {
  try {
    const currentSecret = getSettingValue(db, 'tiplinkWebhookSecret')
    const previousSecret = getSettingValue(db, 'tiplinkWebhookPreviousSecret')
    const previousSecretExpiresAtRaw = getSettingValue(db, 'tiplinkWebhookPreviousSecretExpiresAt')
    const parsedExpiresAt = Number(previousSecretExpiresAtRaw)

    return {
      currentSecret,
      previousSecret,
      previousSecretExpiresAt:
        Number.isFinite(parsedExpiresAt) && parsedExpiresAt > 0 ? parsedExpiresAt : null
    }
  } catch (e) {
    log.error('Error getting TipLink webhook secret state', e)
    return {
      currentSecret: '',
      previousSecret: '',
      previousSecretExpiresAt: null
    }
  }
}

export function getActiveTiplinkWebhookSecrets(
  db: Database,
  log: Logger,
  now = Date.now()
): string[] {
  const secretState = getTiplinkWebhookSecretState(db, log)
  const activeSecrets = [secretState.currentSecret]

  if (
    secretState.previousSecret &&
    secretState.previousSecretExpiresAt !== null &&
    secretState.previousSecretExpiresAt > now
  ) {
    activeSecrets.push(secretState.previousSecret)
  }

  return activeSecrets.filter(
    (secret, index, items) => secret.length > 0 && items.indexOf(secret) === index
  )
}
