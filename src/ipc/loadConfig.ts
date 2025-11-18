import { dialog } from 'electron'
import fs from 'fs'
import { avatarConfigType } from '../types/avatarConfigType'

export async function loadConfig(mainWindow): Promise<avatarConfigType | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select an Avatar JSON',
    filters: [
      {
        name: 'JSON Files',
        extensions: ['json']
      }
    ],
    properties: ['openFile']
  })

  if (canceled || filePaths.length === 0) return null

  try {
    const data = await fs.readFileSync(filePaths[0], 'utf-8')
    const dataParsed: avatarConfigType = JSON.parse(data)

    return dataParsed
  } catch {
    return null
  }
}
