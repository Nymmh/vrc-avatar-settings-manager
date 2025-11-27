import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function syncAvatarNames(log: Logger, db: Database, avatarId: string): boolean {
  try {
    log.info('Trying to sync avatar names')

    const avatarName = db
      .prepare(`SELECT name FROM avatarStorage WHERE avatarId = ? LIMIT 1`)
      .get(avatarId)

    if (avatarName) {
      db.prepare(
        `
            UPDATE avatars
            SET avatarName = ?
            WHERE avatarId = ?
            `
      ).run(avatarName.name, avatarId)
    }

    return true
  } catch (e) {
    log.error('Error syncing avatar names: ', e)
    return false
  }
}
