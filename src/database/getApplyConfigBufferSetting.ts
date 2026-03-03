import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function getApplyConfigBufferSetting(db: Database, log: Logger): boolean {
  try {
    const q = db.prepare('SELECT value FROM settings WHERE key = ?').get('applyConfigBuffer') as
      | { value: string }
      | undefined

    if (q?.value === 'true') {
      return true
    } else {
      return false
    }
  } catch (e) {
    log.error('Error getting apply config buffer setting', e)
    return false
  }
}
