import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export async function updateAvatarData(
  log: Logger,
  db: Database,
  avatarId: string,
  avatarName: string
): Promise<updateAvatarDataInterface> {
  try {
    if (!avatarId || !avatarName) {
      return { success: false, message: 'Avatar ID and name are required' }
    }

    const q = db.prepare('UPDATE avatarStorage SET name = ? WHERE avatarId = ?')
    const result = q.run(avatarName, avatarId)

    if (result.changes === 0) {
      return { success: false, message: 'No avatar found with the provided ID' }
    }

    return { success: true }
  } catch (e) {
    log.error('Error updating avatar data:', e)
    return { success: false, message: 'Error updating avatar data' }
  }
}
