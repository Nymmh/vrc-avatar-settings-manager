import path from 'path'
import fs from 'fs'
import { BrowserWindow } from 'electron'
import { formatConfig } from './formatConfig'
import { lookForConfig } from '../file/lookForConfig'
import { lookForCache } from '../file/lookForCache'

const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')
const BOM_REGEX = /^\uFEFF/
const JUNK_REGEX = /^[^{\[]+/

export function avatarConfig(
  avatarId: string,
  mainWindow: BrowserWindow,
  pendingChanges: Map<string, unknown>
): avatarConfigInterface | void {
  if (!avatarId)
    return mainWindow.webContents.send('foundAvatarFile', {
      success: false
    })

  const aviConfig = lookForConfig(avatarId, vrcPath)
  const aviCache = lookForCache(avatarId, vrcPath)

  if (!aviConfig || !aviCache)
    return mainWindow.webContents.send('foundAvatarFile', {
      success: false
    })

  const aviConfigData = cleanJson(fs.readFileSync(path.join(vrcPath, 'OSC', aviConfig), 'utf-8'))
  const aviCacheData = cleanJson(
    fs.readFileSync(path.join(vrcPath, 'LocalAvatarData', aviCache), 'utf-8')
  )

  const formattedDataConfig = formatConfig(aviConfigData, aviCacheData, pendingChanges)

  mainWindow.webContents.send('foundAvatarFile', {
    success: true
  })
  mainWindow.webContents.send('avatarConfig', formattedDataConfig)

  return formattedDataConfig
}

function cleanJson(data: string): string {
  return data.replace(BOM_REGEX, '').replace(JUNK_REGEX, '').trim()
}
