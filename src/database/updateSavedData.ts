import Database from 'better-sqlite3'
import { Logger } from 'electron-log'
import { checkIfExistById } from './checkIfExistById'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function updateSavedConfigData(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  id: number,
  avatarId: string,
  saveName: string,
  nsfw: boolean | undefined
): Promise<updateConfigInterface> {
  try {
    log.info(`Updating saved config data`)
    saveName = saveName.trim()
    if (!saveName) {
      log.error('Save name is required')
      return { success: false, message: 'Save name is required' }
    }

    const existing = checkIfExistById(db, id)

    if (!existing) {
      log.error(`No config found`)
      return { success: false, message: `No config found` }
    }

    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Update Warning',
      'Are you sure you want to update the saved config?',
      mainWindow
    )

    if (userResponse.response !== 0) {
      log.info('Update cancelled by user')
      return {
        success: false,
        message: 'Update cancelled'
      }
    }

    avatarId = avatarId.trim() || 'Unknown'

    log.info(`Checking for name conflicts`)
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

    db.prepare(
      `
      UPDATE presets SET avatarId = ? WHERE forUqid = ?
      `
    ).run(avatarId, currentConfig?.uqid)

    log.info(`Config ${saveName} updated`)

    return {
      success: true,
      message: `Config ${saveName} updated`
    }
  } catch (error) {
    log.error('Error updating config:', error)
    return { success: false, message: 'Error updating config' }
  }
}
