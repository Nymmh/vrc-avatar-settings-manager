import Database from 'better-sqlite3'
import { checkIfExist } from './checkIfExist'
import { Logger } from 'electron-log'

export function updateSavedConfig(
  log: Logger,
  db: Database,
  id: number,
  avatarId: string,
  avatarName: string,
  saveName: string,
  nsfw: boolean
): updateConfigInterface {
  try {
    saveName = saveName.trim()
    if (!saveName) return { success: false, message: 'Save name is required' }

    const existing = checkIfExist(db, saveName)

    if (existing && existing == saveName)
      return { success: false, message: 'Config with that name already exists' }

    avatarId = avatarId.trim() || 'Unknown'
    avatarName = avatarName.trim() || 'Unknown'

    const nsfwConvert = nsfw ? 1 : 0

    db.prepare(
      'UPDATE avatars SET avatarId = ?, name = ?, avatarName = ?, nsfw = ? WHERE id = ?'
    ).run(avatarId, saveName, avatarName, nsfwConvert, id)

    return {
      success: true,
      message: `Config ${saveName} updated`
    }
  } catch (error) {
    log.error('Error updating config:', error)
    return { success: false, message: 'Error updating config' }
  }
}
