import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import { Client } from 'node-osc'
import path from 'node:path'
import fs from 'fs'
import { lookForConfig } from '../file/lookForConfig'
import { lookForCache } from '../file/lookForCache'
import { cleanJson } from './cleanJson'
import { applyConfig } from '../services/applyConfig'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { ASMStorage } from '../main/ASMStorage'
import { FT_EXCLUDED, FT_REGEX, isExcluded } from './excludedParameters'

const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')

export async function generateRandomParams(
  log: Logger,
  mainWindow: BrowserWindow,
  avatarId: string,
  OSCClient: Client,
  storage: ASMStorage
): Promise<boolean> {
  try {
    const check1 = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Are you sure?',
      'This will apply random changes to your current avatar. \n\nIn some cases you may have to change avatars and back to stop the avatar from freaking out. You may also be forced to reset the avatar. \n\nIt is highly recommended to create a config before proceeding. \n\nDo you want to continue?',
      mainWindow
    )

    if (check1.response !== 0) {
      log.info('User cancelled random parameter generation')
      return false
    }

    const check2 = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Are you really sure?',
      'This may also include NSFW things, are you really, really sure you want to continue?',
      mainWindow
    )

    if (check2.response !== 0) {
      log.info('User cancelled random parameter generation at second prompt')
      return false
    }

    const aviConfig = lookForConfig(avatarId, vrcPath, log)
    const aviCache = lookForCache(avatarId, vrcPath, log)

    if (!aviConfig || !aviCache) {
      log.error('Avatar config or cache file not found')
      return false
    }

    const aviConfigData = cleanJson(fs.readFileSync(path.join(vrcPath, 'OSC', aviConfig), 'utf-8'))
    const aviCacheData = cleanJson(
      fs.readFileSync(path.join(vrcPath, 'LocalAvatarData', aviCache), 'utf-8')
    )

    const parsedConfig = JSON.parse(aviConfigData)
    const parsedCache = JSON.parse(aviCacheData)

    if (!Array.isArray(parsedCache.animationParameters) || !Array.isArray(parsedConfig.parameters))
      return false

    const parameterMap = new Map(
      parsedConfig.parameters.map((pm) => [pm.name, pm.input?.type === 'Float' ? 'f' : 'i'])
    )

    const cacheValueMap = new Map(parsedCache.animationParameters.map((p) => [p.name, p.value]))

    let randomParams: valuedParamsInterface[] = []

    storage.clearPendingChanges()

    randomParams = parsedConfig.parameters.reduce((ap, c) => {
      let value = cacheValueMap.get(c.name) ?? c.value
      const type = parameterMap.get(c.name)

      if (isExcluded(c.name, true)) return ap
      if (FT_EXCLUDED.has(c.name) || FT_REGEX.test(c.name)) {
        return ap
      }

      if (!type) return ap
      if (!value) value = 0

      const formattedName = c.name.replace(/ /g, '_')

      if (type === 'i') {
        const samples = Array.from({ length: 5 }, () => (Math.random() < 0.5 ? 0 : 1))
        const sum = samples.reduce((a, b) => a + b, 0 as number)
        value = sum >= 3 ? 1 : 0
      } else if (type === 'f') {
        value = parseFloat(Math.random().toFixed(14))
      }

      ap.push({
        name: formattedName,
        value,
        type
      })

      storage.setPendingChanges(formattedName, value)

      return ap
    }, [] as valuedParamsInterface[])

    log.info(`Generated ${randomParams.length} random parameters for avatarId: ${avatarId}`)

    const upload = await applyConfig(log, randomParams, OSCClient)

    if (upload) {
      log.info('Random parameters applied successfully')
      return true
    } else {
      log.error('Failed to apply random parameters')
      return false
    }
  } catch (e) {
    log.error(`Error generating random parameters: ${e}`)
    return false
  }
}
