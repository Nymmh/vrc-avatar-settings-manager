import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export function checkDataFolder(): {
  folderPath: string
  avatarData: string
} {
  const docPath = app.getPath('documents')
  const folderPath = path.join(docPath, 'VRCAvatarSettingsCopy')
  const avatarData = path.join(folderPath, 'exports')

  if (!fs.existsSync(avatarData)) {
    fs.mkdirSync(avatarData, { recursive: true })
  }

  return { folderPath, avatarData }
}
