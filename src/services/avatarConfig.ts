import path from 'path'
import fs from 'fs'
import { lookForConfig } from '../file/lookForConfig'
import { BrowserWindow } from 'electron'
import { formatConfig } from './formatConfig'
import { lookForCache } from '../file/lookForCache'

export async function avatarConfig(
  avatarId: string,
  mainWindow: BrowserWindow,
  pendingChanges: Map<string, any>
): Promise<void | avatarConfigInterface> {
  if (!avatarId) {
    return mainWindow.webContents.send('foundAvatarFile', {
      success: false
    })
  }

  const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')
  const [aviConfig, aviCache] = await Promise.all([
    lookForConfig(avatarId, vrcPath),
    lookForCache(avatarId, vrcPath)
  ])

  if (aviConfig && aviCache) {
    let aviConfigData = fs.readFileSync(path.join(vrcPath, 'OSC', aviConfig), 'utf-8')
    let aviCacheData = fs.readFileSync(path.join(vrcPath, 'LocalAvatarData', aviCache), 'utf-8')

    aviConfigData = aviConfigData
      .replace(/^\uFEFF/, '')
      .replace(/^[^{\[]+/, '')
      .trim()
    aviCacheData = aviCacheData
      .replace(/^\uFEFF/, '')
      .replace(/^[^{\[]+/, '')
      .trim()

    const formattedDataConfig = await formatConfig(aviConfigData, aviCacheData, pendingChanges)

    mainWindow.webContents.send('foundAvatarFile', {
      success: true
    })
    mainWindow.webContents.send('avatarConfig', formattedDataConfig)

    if (pendingChanges.size > 0) {
      return formattedDataConfig
    }
  } else {
    mainWindow.webContents.send('foundAvatarFile', {
      success: false
    })
  }
}
