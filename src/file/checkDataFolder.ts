import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let cachedPaths: {
  folderPath: string
  avatarConfigData: string
  avatarData: string
  fullExport: string
} | null = null

export function checkDataFolder(): {
  folderPath: string
  avatarConfigData: string
  avatarData: string
  fullExport: string
} {
  if (cachedPaths) return cachedPaths

  const docPath = app.getPath('documents')
  const folderPath = path.join(docPath, 'VRCAvatarSettingsManager')
  const avatarConfigData = path.join(folderPath, 'exports', 'configs')
  const avatarData = path.join(folderPath, 'exports', 'avatars')
  const fullExport = path.join(folderPath, 'exports', 'full')

  fs.mkdirSync(avatarConfigData, { recursive: true })
  fs.mkdirSync(avatarData, { recursive: true })
  fs.mkdirSync(fullExport, { recursive: true })

  cachedPaths = { folderPath, avatarConfigData, avatarData, fullExport }

  return cachedPaths
}
