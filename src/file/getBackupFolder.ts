import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export function getBackupFolder(): string {
  let backupPath = ''

  const docPath = app.getPath('documents')
  const folderPath = path.join(docPath, 'VRCAvatarSettingsManagerBackup')

  fs.mkdirSync(folderPath, { recursive: true })

  backupPath = folderPath

  return backupPath
}
