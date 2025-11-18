import path from 'path'
import fs from 'fs'
import { lookForConfig } from './lookForConfig'
import { BrowserWindow } from 'electron'
import { formatConfig } from './formatConfig'
import { lookForCache } from './lookForCache'

export async function avatarConfig(avatarId: string, mainWindow: BrowserWindow): Promise<void> {
  const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')
  const aviConfig = await lookForConfig(avatarId, vrcPath)
  const aviCache = await lookForCache(avatarId, vrcPath)

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

    const formattedDataConfig = await formatConfig(aviConfigData, aviCacheData)

    mainWindow.webContents.send('foundAvatarFile', {
      success: true
    })
    mainWindow.webContents.send('avatarConfig', {
      data: formattedDataConfig
    })
  } else {
    mainWindow.webContents.send('foundAvatarFile', {
      success: false
    })
  }
}
