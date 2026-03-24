import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function setTiplinkWebhookSecret(db: Database, value: string, log: Logger): boolean {
  try {
    const updateStmt = db.prepare(
      `UPDATE settings SET value = ? WHERE key = 'tiplinkWebhookSecret'`
    )
    const result = updateStmt.run(value)

    if (result.changes === 0) {
      db.prepare(`INSERT INTO settings (key, value) VALUES ('tiplinkWebhookSecret', ?)`).run(value)
    }

    return true
  } catch (e) {
    log.error('Error setting TipLink webhook secret', e)
    return false
  }
}
