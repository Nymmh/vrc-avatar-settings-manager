import { Logger } from 'electron-log'
import { Client } from 'node-osc'
import { Database } from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { saveConfig } from './saveConfig'
import { checkIfExist } from '../database/checkIfExist'
import { uploadConfig } from '../services/uploadConfig'
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
  const upload = uploadConfig(log, loadedJson, OSC_CLIENT)

  if (!saveOption) {
    const uploadWait = await upload

    log.info(uploadWait ? 'Upload successful' : 'Upload failed')
    return { upload: uploadWait }
  }

  currentAviId = currentAviId?.trim()
  avatarName = avatarName?.trim()
  saveName = saveName?.trim()

  if (!currentAviId)
    return { upload: await upload, save: false, saveMessage: 'Invalid avatar ID in file' }
  if (!avatarName)
    return { upload: await upload, save: false, saveMessage: 'Invalid avatar name in file' }
  if (!saveName) return { upload: await upload, save: false, saveMessage: 'Invalid save name' }

  const existing = checkIfExist(db, saveName)

  if (existing) {
    const userResponse = await showWarning(
      ['Overwrite', 'Cancel'],
      0,
      'Overwrite Confirmation',
      'A config with that name already exists. Do you want to overwrite it?',
      mainWindow
    )

    if (userResponse.response !== 0) {
      return { upload: await upload, save: false, saveMessage: 'Declined overwrite' }
    }
  }

  loadedJson.id = currentAviId
  loadedJson.name = avatarName

  const save = saveConfig(log, db, loadedJson, saveName, true, loadedJson.nsfw || false, true)

  const u = await upload

  log.info(
    `Upload: ${u ? 'successful' : 'failed'}, Save: ${save.success ? 'successful' : 'failed'}`
  )

  return {
    upload: u,
    save: save.success,
    saveMessage: save.message || ''
  }
}
