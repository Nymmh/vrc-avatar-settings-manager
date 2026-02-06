import path from 'path'
import fs from 'fs'
import { Logger } from 'electron-log'
import { Client } from 'node-osc'
import { BrowserWindow } from 'electron'
import { Database } from 'better-sqlite3'
import { saveConfig } from './saveConfig'
import { uploadConfig } from '../services/uploadConfig'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { lookForConfig } from '../file/lookForConfig'
import { lookForCache } from '../file/lookForCache'
import { cleanJson } from '../helpers/cleanJson'
import { formatConfig } from '../services/formatConfig'

const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')

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
  log.info('Uploading configuration and applying...')
  if (
    (loadedJson.type && loadedJson.type !== 'config') ||
    !loadedJson.valuedParams ||
    !Array.isArray(loadedJson.valuedParams) ||
    !loadedJson.avatarId
  ) {
    log.error('Uploaded data is not a valid config')
    return {
      upload: false,
      saveMessage: 'Uploaded data is not a valid config'
    }
  }

  currentAviId = currentAviId?.trim()

  if (currentAviId !== loadedJson.avatarId) {
    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Confirm',
      `The avatar ID in the uploaded config does not match the current avatar. Do you want to proceed?`,
      mainWindow
    )

    if (userResponse.response !== 0) {
      log.info('Upload cancelled by user due to avatar ID mismatch')
      return {
        upload: false,
        saveMessage: 'Upload cancelled by user'
      }
    }
  }

  let nsfwResponse = 0
  let upload: unknown

  const aviConfig = lookForConfig(currentAviId, vrcPath, log)
  const aviCache = lookForCache(currentAviId, vrcPath, log)

  if (aviConfig && aviCache) {
    log.info('Found avatar config and cache files')

    const aviConfigData = cleanJson(fs.readFileSync(path.join(vrcPath, 'OSC', aviConfig), 'utf-8'))
    const aviCacheData = cleanJson(
      fs.readFileSync(path.join(vrcPath, 'LocalAvatarData', aviCache), 'utf-8')
    )

    const paramMap = new Map<string, unknown>(
      loadedJson.valuedParams
        .filter(
          (param): param is valuedParamsInterface & { name: string } =>
            typeof param.name === 'string'
        )
        .map((param) => [param.name, param.value])
    )

    const formattedDataConfig = formatConfig(db, aviConfigData, aviCacheData, paramMap, log)
    paramMap.clear()
    loadedJson.valuedParams = formattedDataConfig.valuedParams as valuedParamsInterface[]
  }

  if (loadedJson?.nsfw) {
    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'NSFW Warning',
      `This config is marked as NSFW, are you sure you want to apply it?`,
      mainWindow
    )

    nsfwResponse = userResponse.response
  }

  if (nsfwResponse === 0) {
    upload = uploadConfig(log, loadedJson, OSC_CLIENT)
  } else {
    log.info('Upload cancelled by user due to NSFW warning')
    upload = false
  }

  if (!saveOption) {
    const uploadWait = (await upload) as boolean

    log.info(uploadWait ? 'Upload successful' : 'Upload failed')
    return { upload: uploadWait }
  }

  avatarName = avatarName?.trim()
  saveName = saveName?.trim()

  if (!currentAviId) {
    log.error('Invalid avatar ID in file')

    return {
      upload: (await upload) as boolean,
      save: false,
      saveMessage: 'Invalid avatar ID in file'
    }
  }

  if (!avatarName) {
    log.error('Invalid avatar name in file')

    return {
      upload: (await upload) as boolean,
      save: false,
      saveMessage: 'Invalid avatar name in file'
    }
  }

  if (!saveName) {
    log.error('Invalid save name')
    return { upload: (await upload) as boolean, save: false, saveMessage: 'Invalid save name' }
  }

  loadedJson.avatarId = currentAviId
  loadedJson.name = avatarName

  const save = await saveConfig(
    log,
    db,
    loadedJson,
    saveName,
    loadedJson?.nsfw ? true : false,
    true,
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
