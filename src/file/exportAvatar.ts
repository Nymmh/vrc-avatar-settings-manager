import { BrowserWindow, Dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { checkDataFolder } from './checkDataFolder'
import { getExportVersion } from '../database/getExportVersion'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { exportAvatarShareCode } from './exportAvatarShareCode'

export async function exportAvatar(
  log: Logger,
  db: Database,
  dialog: Dialog,
  mainWindow: BrowserWindow,
  avatarId: string
): Promise<exportAvatarInterface> {
  try {
    log.info('Starting avatar export process')
    if (!avatarId || typeof avatarId !== 'string' || avatarId.trim() === '') {
      log.error('Invalid Avatar ID provided')
      return { success: false, message: 'Invalid Avatar ID provided' }
    }

    const q = db
      .prepare('SELECT avatarId,name FROM avatarStorage WHERE avatarId = ? LIMIT 1')
      .get(avatarId) as avatarStorageDBInterface | undefined

    if (!q) {
      log.error('No avatar found with the provided ID')
      return { success: false, message: 'No avatar found' }
    }

    const { avatarData } = checkDataFolder()

    const exportTypeResponse = await showDialogNoSound(
      ['Share Code', 'JSON', 'Cancel'],
      0,
      'Export Type',
      `What type of file would you like to export?`,
      mainWindow
    )

    if (exportTypeResponse.response === 2) {
      log.info('User cancelled exporting share')
      return { success: false, message: 'Cancelled exporting' }
    }

    let exportShareCode = false
    let filePath = ''

    if (exportTypeResponse.response === 0) {
      exportShareCode = true
      // return await copyConfigCode(log, db, dialog, mainWindow, 0, true, true)
    } else {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Avatar',
        defaultPath: `${path.join(avatarData, `avatar_${q.name || ''}`)}.json`,
        filters: [
          { name: 'JSON', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        log.info('Export configuration canceled or no file path specified')
        return {
          success: false,
          message: 'Export configuration canceled or no file path specified'
        }
      }

      filePath = result.filePath
    }

    const a = db
      .prepare(
        'SELECT uqid, avatarId, name, avatarName, nsfw, parameters, isPreset FROM avatars WHERE avatarId = ?'
      )
      .all(avatarId) as avatarDBInterface[] | undefined

    if (!a) {
      log.error('No avatar configuration found for the provided ID')
      return { success: false, message: 'No avatar configuration found' }
    }

    for (const av of a) {
      const p = db
        .prepare('SELECT avatarId, name, unityParameter FROM presets WHERE forUqid = ? LIMIT 1')
        .get(av.uqid) as avatarPresetsInterface | undefined

      av.presets = {
        forUqid: av.uqid,
        avatarId: p?.avatarId || '',
        name: p?.name || '',
        unityParameter: p?.unityParameter || 0
      }
    }

    const exportVersion = getExportVersion(db, log)

    if (exportVersion === undefined) {
      log.error('Could not get export version ')
      return { success: false, message: 'Could not get export version.' }
    }

    log.info(`Export version: ${exportVersion}`)

    const exportData = {
      type: 'avatar',
      version: exportVersion,
      avatarId: q.avatarId,
      name: q.name,
      configs: a
    }

    if (!exportShareCode) {
      await fs.promises.writeFile(filePath, JSON.stringify(exportData), 'utf-8')

      log.info('Avatar exported successfully')
      return { success: true, message: 'Config exported' }
    } else {
      return await exportAvatarShareCode(log, db, dialog, mainWindow, exportData)
    }
  } catch (e) {
    log.error('Error exporting avatar:', e)
    return { success: false, message: 'Error exporting avatar' }
  }
}
