import Database from 'better-sqlite3'
import { Logger } from 'electron-log'
import { checkIfExistById } from './checkIfExistById'

export function updateSavedConfig(
  log: Logger,
  db: Database,
  id: number,
  avatarId: string,
  avatarName: string,
  saveName: string,
  nsfw: boolean | undefined
): updateConfigInterface {
  try {
    saveName = saveName.trim()
    if (!saveName) return { success: false, message: 'Save name is required' }

    const existing = checkIfExistById(db, id)

    if (!existing) {
      return { success: false, message: `No config found` }
    }

    avatarId = avatarId.trim() || 'Unknown'
    avatarName = avatarName.trim() || 'Unknown'

    const currentConfig = db
      .prepare(
        `
      SELECT name, avatarId FROM avatars where id = ?
      `
      )
      .get(id) as { name: string; avatarId: string } | undefined

    if (
      currentConfig &&
      (currentConfig.name.trim() !== saveName || currentConfig.avatarId.trim() !== avatarId)
    ) {
      let updateName = saveName
      let counter = 1

      while (true) {
        const dup = db
          .prepare(
            `
          SELECT id FROM avatars WHERE name = ? AND avatarId = ? AND id != ?
        `
          )
          .get(updateName, avatarId, id)

        if (!dup) break

        updateName = `${saveName} (${counter})`
        counter++
      }

      saveName = updateName
    }

    if (nsfw !== undefined) {
      const nsfwConvert = nsfw ? 1 : 0
      db.prepare(
        'UPDATE avatars SET avatarId = ?, name = ?, avatarName = ?, nsfw = ? WHERE id = ?'
      ).run(avatarId, saveName, avatarName, nsfwConvert, id)
    } else {
      db.prepare('UPDATE avatars SET avatarId = ?, name = ?, avatarName = ? WHERE id = ?').run(
        avatarId,
        saveName,
        avatarName,
        id
      )
    }

    return {
      success: true,
      message: `Config ${saveName} updated`
    }
  } catch (error) {
    log.error('Error updating config:', error)
    return { success: false, message: 'Error updating config' }
  }
}
