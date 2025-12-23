import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { saveConfig } from './saveConfig'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function uploadConfig(
  log: Logger,
  db: Database,
  saveName: string | '',
  nsfw: boolean,
  avatarId: string | '',
  config: avatarDBInterface,
  mainWindow: BrowserWindow
): Promise<uploadConfigInterface> {
  log.info('Uploading configuration...')
  if (config.type && config.type !== 'config') {
    return {
      upload: false,
      saveMessage: 'Uploaded data is not a valid config'
    }
  }

  const normalizedSaveName = saveName.trim() || config?.name?.trim() || 'Unknown'

  config.avatarId = avatarId?.trim() || config.avatarId?.trim() || 'Unknown'

  if (config?.nsfw && !nsfw) {
    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'NSFW Warning',
      `This config is marked as NSFW, are you sure you want to save it?`,
      mainWindow
    )

    if (userResponse.response !== 0) {
      return {
        upload: false,
        saveMessage: 'Upload cancelled by user'
      }
    }

    nsfw = true
  } else if (nsfw) config.nsfw = 1

  const save = await saveConfig(log, db, config, normalizedSaveName, nsfw, true, mainWindow)

  if (save.success) log.info('Upload successful')

  return {
    upload: save.success,
    saveMessage: save.message || ''
  }
}
