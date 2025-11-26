import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let cachedPaths: {
  folderPath: string
  avatarConfigData: string
  avatarData: string
} | null = null

export function checkDataFolder(): {
  folderPath: string
  avatarConfigData: string
  avatarData: string
} {
  if (cachedPaths) return cachedPaths

  const docPath = app.getPath('documents')
  const folderPath = path.join(docPath, 'VRCAvatarSettingsManager')
  const avatarConfigData = path.join(folderPath, 'exports', 'configs')
  const avatarData = path.join(folderPath, 'exports', 'avatars')

  fs.mkdirSync(avatarConfigData, { recursive: true })
  fs.mkdirSync(avatarData, { recursive: true })

  cachedPaths = { folderPath, avatarConfigData, avatarData }

  return cachedPaths
}
