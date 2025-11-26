import Database from 'better-sqlite3'
import { Logger } from 'electron-log'
import { checkIfExistById } from './checkIfExistById'
import { avatarConfig } from '../services/avatarConfig'
import { BrowserWindow } from 'electron'

export function updateSavedConfigData(
  log: Logger,
  db: Database,
  id: number,
  avatarId: string,
  saveName: string,
  nsfw: boolean | undefined,
  mainWindow: BrowserWindow,
  pendingChanges: Map<string, unknown>
): updateConfigInterface {
  try {
    saveName = saveName.trim()
    if (!saveName) return { success: false, message: 'Save name is required' }

    const existing = checkIfExistById(db, id)

    if (!existing) {
      return { success: false, message: `No config found` }
    }

    avatarId = avatarId.trim() || 'Unknown'

    const currentConfig = db
      .prepare(
        `
      SELECT name, avatarId, uqid FROM avatars where id = ?
      `
      )
      .get(id) as { name: string; avatarId: string; uqid: string } | undefined

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
      db.prepare('UPDATE avatars SET avatarId = ?, name = ?, nsfw = ? WHERE id = ?').run(
        avatarId,
        saveName,
        nsfwConvert,
        id
      )
    } else {
      db.prepare('UPDATE avatars SET avatarId = ?, name = ? WHERE id = ?').run(
        avatarId,
        saveName,
        id
      )
    }

    const avatarConfigResult = avatarConfig(avatarId, mainWindow, pendingChanges)

    if (!avatarConfigResult) {
      log.error('Failed to get avatar config')
      return { success: false, message: 'Failed to get avatar config' }
    }

    db.prepare(
      `
      UPDATE presets SET avatarId = ? WHERE forUqid = ?
      `
    ).run(avatarId, currentConfig?.uqid)

    return {
      success: true,
      message: `Config ${saveName} updated`
    }
  } catch (error) {
    log.error('Error updating config:', error)
    return { success: false, message: 'Error updating config' }
  }
}
