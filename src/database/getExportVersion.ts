import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function getExportVersion(db: Database, log: Logger): string | undefined {
  try {
    const q = db.prepare('SELECT value FROM settings WHERE key = ?').get('exportVersion') as
      | { value: string }
      | undefined

    if (!q || !q.value) {
      return undefined
    } else {
      return q.value
    }
  } catch (e) {
    log.error('Error getting export version', e)
    return ''
  }
}
