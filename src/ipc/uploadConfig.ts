import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { saveConfig } from './saveConfig'
import { checkIfExist } from '../database/checkIfExist'
import { showWarning } from '../services/showWarning'

export async function uploadConfig(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  saveName: string | '',
  nsfw: boolean,
  avatarId: string | '',
  avatarName: string | '',
  config: avatarConfigInterface
): Promise<uploadConfigInterface> {
  const normalizedSaveName = saveName.trim() || config?.name?.trim() || 'Unknown'

  const existing = checkIfExist(db, normalizedSaveName)

  if (existing) {
    const userResponse = await showWarning(
      ['Overwrite', 'Cancel'],
      0,
      'Overwrite Confirmation',
      'A config with that name already exists. Do you want to overwrite it?',
      mainWindow
    )

    if (userResponse.response !== 0) {
      return { upload: false, saveMessage: 'Declined overwrite' }
    }
  }

  config.id = avatarId?.trim() || config.id?.trim() || 'Unknown'
  config.name = avatarName?.trim() || config.name?.trim() || 'Unknown'

  if (nsfw) config.nsfw = true

  const save = saveConfig(log, db, config, normalizedSaveName, true, nsfw, true)

  if (save.success) log.info('Upload successful')

  return {
    upload: save.success,
    saveMessage: save.message || ''
  }
}
