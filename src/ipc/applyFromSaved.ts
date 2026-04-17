import path from 'path'
import fs from 'fs'
import { Logger } from 'electron-log'
import { BrowserWindow } from 'electron'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { applyConfig } from '../services/applyConfig'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { ASMStorage } from '../main/ASMStorage'
import { lookForConfig } from '../file/lookForConfig'
import { lookForCache } from '../file/lookForCache'
import { formatConfig } from '../services/formatConfig'
import { cleanJson } from '../helpers/cleanJson'
import { getApplyConfigBufferSetting } from '../database/getApplyConfigBufferSetting'

const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')

export interface ApplyFromSavedResult {
  success: boolean
  msg: string
}

interface ApplyFromSavedOptions {
  interactive: boolean
}

async function applyFromSavedInternal(
  log: Logger,
  db: Database,
  id: number,
  currentAvatarId: string,
  OSC_CLIENT: Client,
  mainWindow: BrowserWindow,
  storage: ASMStorage,
  options: ApplyFromSavedOptions
): Promise<ApplyFromSavedResult> {
  try {
    log.info(`Applying config: ${id}`)

    const q = db
      .prepare('SELECT avatarId,nsfw,parameters FROM avatars WHERE id = ? LIMIT 1')
      .get(id) as applyFromSavedInterface | undefined

    if (!q) {
      log.error(`Config not found: ${id}`)
      return { success: false, msg: 'Saved config not found' }
    }

    let parameters: valuedParamsInterface[]

    try {
      parameters = JSON.parse(q.parameters)
    } catch {
      log.error('Error parsing JSON:')
      return { success: false, msg: 'Saved config contains invalid parameter data' }
    }

    const warningButtons = ['Apply', 'Cancel']

    if (q.avatarId !== currentAvatarId) {
      if (!options.interactive) {
        log.warn('Saved config avatar mismatch for webhook apply')
        return {
          success: false,
          msg: 'Saved config belongs to a different avatar than the current avatar'
        }
      }

      const userResponse = await showDialogNoSound(
        warningButtons,
        0,
        'Avatar Mismatch',
        `The avatar ID's do not match. Applying this configuration may lead to unexpected results. Do you want to proceed?`,
        mainWindow
      )

      if (userResponse.response !== 0) {
        log.info('User cancelled avatar mismatch')
        return { success: false, msg: 'User cancelled avatar mismatch warning' }
      }
    }

    if (q.nsfw) {
      // if (!options.interactive) {
      //   log.warn('Saved config marked NSFW for webhook apply')
      //   return {
      //     success: false,
      //     msg: 'Saved config is marked as NSFW and cannot be applied remotely'
      //   }
      // }

      if (options.interactive) {
        const userResponse = await showDialogNoSound(
          warningButtons,
          0,
          'NSFW',
          `This config is marked as NSFW. Do you want to proceed?`,
          mainWindow
        )

        if (userResponse.response !== 0) {
          log.info('User cancelled NSFW')
          return { success: false, msg: 'User cancelled NSFW warning' }
        }
      }
    }

    const aviConfig = lookForConfig(currentAvatarId, vrcPath, log)
    const aviCache = lookForCache(currentAvatarId, vrcPath, log)

    if (!aviConfig || !aviCache) {
      log.warn('Avatar config or cache file not found... could not apply')
      return { success: false, msg: 'Current avatar files could not be found' }
    }

    log.info('Found avatar config and cache files')

    const aviConfigData = cleanJson(fs.readFileSync(path.join(vrcPath, 'OSC', aviConfig), 'utf-8'))
    const aviCacheData = cleanJson(
      fs.readFileSync(path.join(vrcPath, 'LocalAvatarData', aviCache), 'utf-8')
    )

    const paramMap = new Map<string, unknown>(
      parameters
        .filter(
          (param): param is valuedParamsInterface & { name: string } =>
            typeof param.name === 'string'
        )
        .map((param) => [param.name, param.value])
    )

    const formattedDataConfig = formatConfig(db, aviConfigData, aviCacheData, paramMap, log)

    paramMap.clear()

    parameters = formattedDataConfig.valuedParams as valuedParamsInterface[]
    const formattedParamValueMap = new Map<string, unknown>()

    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i]
      if (typeof param === 'string' || param.name === undefined) continue
      formattedParamValueMap.set(param.name, param.value)
    }

    const checkApplyBuffer = getApplyConfigBufferSetting(db, log)

    if (checkApplyBuffer) {
      // Workaround for some avis having issue updating params, it will be a setting in the app to toggle
      // We basically buffer the value to 0.75 to force it to change on the next update
      // Issue has only been found with params at 1.0~ so i just used 0.9 :teehee:
      const pendingChanges = storage.getPendingChanges()
      let bufferParamsMap: Map<string, unknown> | null = null

      if (pendingChanges.size > 0) {
        for (const [name, value] of pendingChanges) {
          const targetValue = formattedParamValueMap.get(name)

          if (typeof value === 'number' && value >= 0.9 && value !== targetValue) {
            if (bufferParamsMap === null) {
              bufferParamsMap = new Map<string, unknown>()
            }
            bufferParamsMap.set(name, 0.75)
          }
        }
      }

      if (bufferParamsMap !== null) {
        const bufferConfig = formatConfig(db, aviConfigData, aviCacheData, bufferParamsMap, log)
        const bufferParams = bufferConfig.valuedParams as valuedParamsInterface[]
        await applyConfig(log, bufferParams, OSC_CLIENT)
      }

      bufferParamsMap?.clear()
    }

    const setPendingChanges = new Map<string, unknown>()

    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i]
      if (typeof param === 'string' || param.name === undefined) continue
      setPendingChanges.set(param.name, param.value)
    }

    storage.setPendingChangesBulk(setPendingChanges)
    setPendingChanges.clear()
    formattedParamValueMap.clear()

    const applySuccess = await applyConfig(log, parameters, OSC_CLIENT)
    return {
      success: applySuccess,
      msg: applySuccess ? 'Saved config applied successfully' : 'Failed to apply saved config'
    }
  } catch (e) {
    log.error('Error applying config from saved:', e)
    return { success: false, msg: 'Unexpected error applying saved config' }
  }
}

export async function applyFromSaved(
  log: Logger,
  db: Database,
  id: number,
  currentAvatarId: string,
  OSC_CLIENT: Client,
  mainWindow: BrowserWindow,
  storage: ASMStorage
): Promise<boolean> {
  const result = await applyFromSavedInternal(
    log,
    db,
    id,
    currentAvatarId,
    OSC_CLIENT,
    mainWindow,
    storage,
    { interactive: true }
  )

  return result.success
}

export async function applyFromSavedForWebhook(
  log: Logger,
  db: Database,
  id: number,
  currentAvatarId: string,
  OSC_CLIENT: Client,
  mainWindow: BrowserWindow,
  storage: ASMStorage
): Promise<ApplyFromSavedResult> {
  return applyFromSavedInternal(log, db, id, currentAvatarId, OSC_CLIENT, mainWindow, storage, {
    interactive: false
  })
}
