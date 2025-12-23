import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function setSaveFaceTrackingSetting(db: Database, value: boolean, log: Logger): boolean {
  try {
    const u = db.prepare(`UPDATE settings SET value = ? WHERE key = 'saveFaceTrackingSettings'`)
    u.run(value ? 'true' : 'false')
    return true
  } catch (e) {
    log.error('Error setting save face tracking setting', e)
    return false
  }
}
