import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import { formatConfig } from './formatConfig'
import { lookForConfig } from '../file/lookForConfig'
import { lookForCache } from '../file/lookForCache'
import { cleanJson } from '../helpers/cleanJson'

const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')
export function avatarConfig(
  db: Database,
  avatarId: string,
  mainWindow: BrowserWindow,
  pendingChanges: Map<string, unknown>,
  log: Logger
): avatarDBInterface | void {
  if (!avatarId) {
    log.warn('No avatarId provided to avatarConfig')
    return mainWindow.webContents.send('foundAvatarFile', {
      success: false
    })
  }

  log.info('Fetching avatar config for avatarId:', avatarId)

  const aviConfig = lookForConfig(avatarId, vrcPath, log)
  const aviCache = lookForCache(avatarId, vrcPath, log)

  if (!aviConfig || !aviCache)
    return mainWindow.webContents.send('foundAvatarFile', {
      success: false
    })

  const aviConfigData = cleanJson(fs.readFileSync(path.join(vrcPath, 'OSC', aviConfig), 'utf-8'))
  const aviCacheData = cleanJson(
    fs.readFileSync(path.join(vrcPath, 'LocalAvatarData', aviCache), 'utf-8')
  )

  const formattedDataConfig = formatConfig(db, aviConfigData, aviCacheData, pendingChanges, log)

  mainWindow.webContents.send('foundAvatarFile', {
    success: true
  })
  mainWindow.webContents.send('avatarConfig', formattedDataConfig)

  log.info('Successfully fetched avatar config for avatarId:', avatarId)

  return formattedDataConfig
}
