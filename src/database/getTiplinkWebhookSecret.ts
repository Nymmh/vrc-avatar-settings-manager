import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function getTiplinkWebhookSecret(db: Database, log: Logger): string {
  try {
    const row = db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('tiplinkWebhookSecret') as { value: string } | undefined

    return row?.value ?? ''
  } catch (e) {
    log.error('Error getting TipLink webhook secret', e)
    return ''
  }
}
