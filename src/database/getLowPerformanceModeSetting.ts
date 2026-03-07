import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function getLowPerformanceModeSetting(db: Database, log: Logger): boolean {
  try {
    const q = db.prepare('SELECT value FROM settings WHERE key = ?').get('lowPerformanceMode') as
      | { value: string }
      | undefined

    if (q?.value === 'true') {
      return true
    } else {
      return false
    }
  } catch (e) {
    log.error('Error getting low performance mode setting', e)
    return false
  }
}
