import { Logger } from 'electron-log'
import { Client } from 'node-osc'
import { Database } from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { uploadConfig } from '../services/uploadConfig'
import { saveConfig } from './saveConfig'
import { checkIfExist } from '../database/checkIfExist'
import { showWarning } from '../services/showWarning'

export async function uploadConfigAndApply(
  log: Logger,
  db: Database,
  loadedJson: avatarConfigInterface,
  OSC_CLIENT: Client,
  saveName: string,
  saveOption: boolean,
  mainWindow: BrowserWindow,
  currentAviId: string,
  avatarName: string
): Promise<uploadConfigAndApplyTypeInterface> {
  const upload = await uploadConfig(log, loadedJson, OSC_CLIENT)

  if (saveOption) {
    const existing = await checkIfExist(db, saveName)

    if (existing) {
      const userResponse = await showWarning(
        ['Overwrite', 'Cancel'],
        0,
        'Overwrite Confirmation',
        'A config with that name already exists. Do you want to overwrite it?',
        mainWindow
      )

      if (userResponse.response !== 0) {
        return { upload: true, save: false, saveMessage: 'Declined overwrite' }
      }
    }

    if (!currentAviId || typeof currentAviId !== 'string' || currentAviId.trim().length === 0) {
      return { upload, save: false, saveMessage: 'Invalid avatar ID in file' }
    }

    if (!avatarName || typeof avatarName !== 'string' || avatarName.trim().length === 0) {
      return { upload, save: false, saveMessage: 'Invalid avatar name in file' }
    }

    loadedJson.id = currentAviId
    loadedJson.name = avatarName

    const save = await saveConfig(
      log,
      db,
      loadedJson,
      saveName,
      true,
      loadedJson.nsfw || false,
      true
    )

    return {
      upload,
      save: save.success,
      saveMessage: save.message || ''
    }
  }

  if (upload) {
    log.info('Upload successful')
    return { upload: true }
  } else {
    log.error('Upload failed')
    return { upload: false }
  }
}
