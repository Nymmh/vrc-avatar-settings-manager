import { dialog } from 'electron'
import { Logger } from 'electron-log'
import fs from 'fs'
import { avatarConfigType } from '../types/avatarConfigType'

export async function loadConfig(log: Logger, mainWindow): Promise<avatarConfigType | null> {
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

  if (canceled || filePaths.length === 0) {
    log.info('Load configuration canceled or no file selected')
    return null
  }

  try {
    const data = await fs.readFileSync(filePaths[0], 'utf-8')
    return JSON.parse(data) as avatarConfigType
  } catch (e) {
    log.error('Failed to load configuration file', e)
    return null
  }
}
