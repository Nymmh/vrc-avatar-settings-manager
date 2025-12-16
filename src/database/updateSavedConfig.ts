import Database from 'better-sqlite3'
import { Logger } from 'electron-log'
import { checkIfExistById } from './checkIfExistById'
import { avatarConfig } from '../services/avatarConfig'
import { BrowserWindow } from 'electron'

export function updateSavedConfig(
  log: Logger,
  db: Database,
  id: number,
  avatarId: string,
  avatarName: string,
  saveName: string,
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
    avatarName = avatarName.trim() || 'Unknown'

    const currentConfig = db
      .prepare(
        `
      SELECT name, avatarId, uqid FROM avatars where id = ?
      `
      )
      .get(id) as { name: string; avatarId: string; uqid: string } | undefined

    const avatarConfigResult = avatarConfig(db, avatarId, mainWindow, pendingChanges)

    if (!avatarConfigResult) {
      log.info('Failed to get avatar config')
      return { success: false, message: 'Failed to get avatar config' }
    }

    const config = avatarConfigResult.valuedParams

    db.prepare(
      `
      UPDATE presets SET avatarId = ? WHERE forUqid = ?
      `
    ).run(avatarId, currentConfig?.uqid)

    db.prepare(
      `
      UPDATE avatars SET parameters = ? WHERE id = ?
    `
    ).run(JSON.stringify(config), id)

    return {
      success: true,
      message: `Config ${saveName} updated`
    }
  } catch (error) {
    log.info('Error updating config:', error)
    return { success: false, message: 'Error updating config' }
  }
}
