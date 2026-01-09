import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function getCopyForDiscordSetting(db: Database, log: Logger): boolean {
  try {
    const q = db.prepare('SELECT value FROM settings WHERE key = ?').get('copyForDiscord') as
      | { value: string }
      | undefined

    if (q?.value === 'true') {
      return true
    } else {
      return false
    }
  } catch (e) {
    log.error('Error getting copy for discord setting', e)
    return false
  }
}
