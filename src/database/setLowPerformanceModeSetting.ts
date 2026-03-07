import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function setLowPerformanceModeSetting(db: Database, value: boolean, log: Logger): boolean {
  try {
    const u = db.prepare(`UPDATE settings SET value = ? WHERE key = 'lowPerformanceMode'`)
    u.run(value ? 'true' : 'false')
    return true
  } catch (e) {
    log.error('Error setting low performance mode setting', e)
    return false
  }
}
