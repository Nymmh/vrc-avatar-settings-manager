import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function setCopyForDiscordSetting(db: Database, value: boolean, log: Logger): boolean {
  try {
    const u = db.prepare(`UPDATE settings SET value = ? WHERE key = 'copyForDiscord'`)
    u.run(value ? 'true' : 'false')
    return true
  } catch (e) {
    log.error('Error setting copy for discord setting', e)
    return false
  }
}
