import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { saveConfig } from './saveConfig'
import { BrowserWindow } from 'electron'

export async function uploadConfig(
  log: Logger,
  db: Database,
  saveName: string | '',
  nsfw: boolean,
  avatarId: string | '',
  avatarName: string | '',
  config: avatarConfigInterface,
  mainWindow: BrowserWindow
): Promise<uploadConfigInterface> {
  if (config.type && config.type !== 'config') {
    return {
      upload: false,
      saveMessage: 'Uploaded data is not a valid avatar config'
    }
  }

  const normalizedSaveName = saveName.trim() || config?.name?.trim() || 'Unknown'

  config.id = avatarId?.trim() || config.id?.trim() || 'Unknown'
  config.name = avatarName?.trim() || config.name?.trim() || 'Unknown'

  if (nsfw) config.nsfw = true

  const save = await saveConfig(log, db, config, normalizedSaveName, true, nsfw, true, mainWindow)

  if (save.success) log.info('Upload successful')

  return {
    upload: save.success,
    saveMessage: save.message || ''
  }
}
