import { BrowserWindow, clipboard } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { brotliDecompressSync, inflateSync } from 'node:zlib'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { checksum } from '../helpers/checksum'
import path from 'node:path'
import fs from 'fs'
import { Client } from 'node-osc'
import { lookForConfig } from './lookForConfig'
import { lookForCache } from './lookForCache'
import { uploadConfig } from '../services/uploadConfig'
import { saveConfig } from '../ipc/saveConfig'
import { formatConfigPasteCode } from '../services/formatConfigPasteCode'
import { fromBase91 } from '../helpers/fromBase91'
import { cleanJson } from '../helpers/cleanJson'

const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')

export async function applyConfigCode(
  log: Logger,
  avatarDB: Database,
  mainWindow: BrowserWindow,
  currentAviId: string,
  OSC_CLIENT: Client
): Promise<exportConfigInterface> {
  try {
    let clipboardText = clipboard.readText().trim()

    // For if the person exported with Discord formatting but was pasted raw
    if (clipboardText.startsWith('```')) {
      clipboardText = clipboardText.slice(3)
      if (clipboardText.endsWith('```')) {
        clipboardText = clipboardText.slice(0, -3)
      }
      clipboardText = clipboardText.trim()
    }

    if (!clipboardText || !clipboardText.startsWith('ASM:v')) {
      log.error('Invalid config code in clipboard')
      return { success: false, message: 'Invalid config code in clipboard' }
    }

    const parts = clipboardText.split(':')
    if (parts.length !== 4) {
      log.error('Invalid config code format')
      return { success: false, message: 'Invalid config code format' }
    }

    // const version = parts[1].substring(1)
    const sum = parts[2]
    const encoded = parts[3]

    const calculatedSum = checksum(encoded)
    if (sum !== calculatedSum) {
      log.error('Checksum mismatch - data may be corrupted')
      return { success: false, message: 'Checksum mismatch - data may be corrupted' }
    }

    const compressed = fromBase91(encoded)

    let jsonString: string
    try {
      jsonString = brotliDecompressSync(compressed).toString('utf-8')
    } catch {
      try {
        jsonString = inflateSync(compressed).toString('utf-8')
      } catch {
        log.error('Failed to decompress config data')
        return { success: false, message: 'Failed to decompress config data' }
      }
    }

    log.info('Copied config is valid')
    const data = JSON.parse(jsonString)

    const fullParams = data.p.map((param: [string, number | null | undefined, string?]) => {
      const [name, value, type] = param
      return {
        name,
        value: value ?? 0,
        type: type || 'i'
      }
    })

    const paramsMap = new Map(
      fullParams.map((param: { name: string; value: number; type: string }) => [
        param.name,
        { value: param.value, type: param.type }
      ])
    ) as Map<string, { value: number | string; type: string }>

    const config = {
      type: data.t === 'c' ? 'config' : data.t,
      avatarId: data.a || 'Unknown',
      uqid: data.u || '',
      name: data.n || new Date().toISOString(),
      avatarName: data.an || 'Unknown',
      nsfw: data.ns === 1,
      valuedParams: paramsMap,
      isPreset: data.ip === 1,
      presets: data.pr || {}
    }

    log.info('Fetching avatar config for avatarId:', config.avatarId)

    const aviConfig = lookForConfig(config.avatarId, vrcPath, log)
    const aviCache = lookForCache(config.avatarId, vrcPath, log)

    if (!aviConfig || !aviCache) {
      return { success: false, message: 'Avatar data files not found' }
    }

    const aviConfigData = cleanJson(fs.readFileSync(path.join(vrcPath, 'OSC', aviConfig), 'utf-8'))
    const aviCacheData = cleanJson(
      fs.readFileSync(path.join(vrcPath, 'LocalAvatarData', aviCache), 'utf-8')
    )

    const formattedDataConfig = formatConfigPasteCode(
      avatarDB,
      aviConfigData,
      aviCacheData,
      config.valuedParams,
      log
    )

    let nsfwResponse = 0
    let upload: unknown
    let saveResponse = 0

    if (currentAviId !== config.avatarId) {
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
          success: false,
          message: 'Upload cancelled by user'
        }
      }
    }

    if (config?.nsfw) {
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
      upload = uploadConfig(log, formattedDataConfig, OSC_CLIENT)
    } else {
      log.info('Upload cancelled by user due to NSFW warning')
      upload = false
    }

    const saveRequest = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Save Config',
      `Would you like to save this config?`,
      mainWindow
    )

    saveResponse = saveRequest.response

    if (saveResponse === 0) {
      formattedDataConfig.uqid = config.uqid || ''
      formattedDataConfig.name = config.name || new Date().toISOString()
      formattedDataConfig.avatarName = config.avatarName || 'Unknown'
      formattedDataConfig.nsfw = config.nsfw ? 1 : 0
      formattedDataConfig.isPreset = config.isPreset ? 1 : 0
      formattedDataConfig.presets = config.presets || {}
      await saveConfig(
        log,
        avatarDB,
        formattedDataConfig,
        config.name,
        config?.nsfw ? true : false,
        true,
        mainWindow
      )
    }

    const u = (await upload) as boolean

    log.info(`Upload: ${u ? 'successful' : 'failed'}`)

    return { success: true, message: 'Config code applied successfully' }
  } catch (e) {
    log.error('Error applying config code:', e)
    return { success: false, message: 'Error applying config code' }
  }
}
