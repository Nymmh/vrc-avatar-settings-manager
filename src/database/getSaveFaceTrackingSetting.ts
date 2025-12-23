import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function getSaveFaceTrackingSetting(db: Database, log: Logger): boolean {
  try {
    const faceTrackingSetting = db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('saveFaceTrackingSettings') as { value: string } | undefined

    if (faceTrackingSetting?.value === 'true') {
      return true
    } else {
      return false
    }
  } catch (e) {
    log.error('Error getting save face tracking setting', e)
    return false
  }
}
