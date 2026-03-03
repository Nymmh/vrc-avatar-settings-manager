import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function setApplyConfigBufferSetting(db: Database, value: boolean, log: Logger): boolean {
  try {
    const u = db.prepare(`UPDATE settings SET value = ? WHERE key = 'applyConfigBuffer'`)
    u.run(value ? 'true' : 'false')
    return true
  } catch (e) {
    log.error('Error setting apply config buffer setting', e)
    return false
  }
}
