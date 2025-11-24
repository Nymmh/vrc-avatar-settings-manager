import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let cachedPaths: {
  folderPath: string
  avatarData: string
} | null = null

export function checkDataFolder(): {
  folderPath: string
  avatarData: string
} {
  if (cachedPaths) return cachedPaths

  const docPath = app.getPath('documents')
  const folderPath = path.join(docPath, 'VRCAvatarSettingsManager')
  const avatarData = path.join(folderPath, 'exports')

  fs.mkdirSync(avatarData, { recursive: true })

  cachedPaths = { folderPath, avatarData }

  return cachedPaths
}
