import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function setTiplinkWebhookSecret(db: Database, value: string, log: Logger): boolean {
  try {
    const setSetting = db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )

    db.transaction(() => {
      setSetting.run('tiplinkWebhookSecret', value)
      setSetting.run('tiplinkWebhookPreviousSecret', '')
      setSetting.run('tiplinkWebhookPreviousSecretExpiresAt', '')
    })()

    return true
  } catch (e) {
    log.error('Error setting TipLink webhook secret', e)
    return false
  }
}
