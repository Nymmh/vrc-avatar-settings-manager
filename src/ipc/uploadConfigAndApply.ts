import { Logger } from 'electron-log'
import { Client } from 'node-osc'
import { BrowserWindow } from 'electron'
import { Database } from 'better-sqlite3'
import { saveConfig } from './saveConfig'
import { uploadConfig } from '../services/uploadConfig'
import { showWarning } from '../services/showWarning'

export async function uploadConfigAndApply(
  log: Logger,
  db: Database,
  loadedJson: avatarDBInterface,
  OSC_CLIENT: Client,
  saveName: string,
  saveOption: boolean,
  currentAviId: string,
  avatarName: string,
  mainWindow: BrowserWindow
): Promise<uploadConfigAndApplyTypeInterface> {
  if (loadedJson.type && loadedJson.type !== 'config') {
    return {
      upload: false,
      saveMessage: 'Uploaded data is not a valid avatar config'
    }
  }

  let nsfwResponse = 0
  let upload: unknown

  if (loadedJson?.nsfw) {
    const userResponse = await showWarning(
      ['Yes', 'No'],
      0,
      'Confirm Delete',
      `This config is marked as NSFW, are you sure you want to apply it?`,
      mainWindow
    )

    nsfwResponse = userResponse.response
  }

  if (nsfwResponse === 0) {
    upload = uploadConfig(log, loadedJson, OSC_CLIENT)
  } else {
    upload = false
  }

  if (!saveOption) {
    const uploadWait = (await upload) as boolean

    log.info(uploadWait ? 'Upload successful' : 'Upload failed')
    return { upload: uploadWait }
  }

  currentAviId = currentAviId?.trim()
  avatarName = avatarName?.trim()
  saveName = saveName?.trim()

  if (!currentAviId)
    return {
      upload: (await upload) as boolean,
      save: false,
      saveMessage: 'Invalid avatar ID in file'
    }
  if (!avatarName)
    return {
      upload: (await upload) as boolean,
      save: false,
      saveMessage: 'Invalid avatar name in file'
    }
  if (!saveName)
    return { upload: (await upload) as boolean, save: false, saveMessage: 'Invalid save name' }

  loadedJson.avatarId = currentAviId
  loadedJson.name = avatarName

  const save = await saveConfig(
    log,
    db,
    loadedJson,
    saveName,
    true,
    Boolean(loadedJson.nsfw),
    mainWindow
  )

  const u = (await upload) as boolean

  log.info(
    `Upload: ${u ? 'successful' : 'failed'}, Save: ${save.success ? 'successful' : 'failed'}`
  )

  return {
    upload: u,
    save: save.success,
    saveMessage: save.message || ''
  }
}
