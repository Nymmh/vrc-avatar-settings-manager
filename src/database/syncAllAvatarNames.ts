import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function syncAllAvatarNames(log: Logger, db: Database): boolean {
  try {
    log.info('Trying to sync all avatar names')

    const allAvatars = db.prepare('SELECT avatarId, name FROM avatarStorage').all() as Array<{
      avatarId: string
      name: string
    }>

    if (!allAvatars || allAvatars.length === 0) {
      log.error('No avatars found in avatarStorage')
      return false
    }

    let totalUpdated = 0
    for (const avatar of allAvatars) {
      const result = db
        .prepare('UPDATE avatars SET avatarName = ? WHERE avatarId = ?')
        .run(avatar.name, avatar.avatarId)

      totalUpdated += result.changes
    }

    log.info(`Sync'd ${totalUpdated} avatar name(s)`)

    return true
  } catch (e) {
    log.error('Error syncing avatar names: ', e)
    return false
  }
}
