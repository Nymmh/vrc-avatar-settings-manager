import { BrowserWindow, dialog } from 'electron'
import { Logger } from 'electron-log'
import fs from 'fs'
import { checkDataFolder } from '../file/checkDataFolder'

export async function loadConfig(
  log: Logger,
  mainWindow: BrowserWindow
): Promise<avatarDBInterface | null> {
  const dataFolder = checkDataFolder()

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select an Avatar JSON',
    defaultPath: dataFolder.avatarConfigData,
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
    return JSON.parse(data) as avatarDBInterface
  } catch (e) {
    log.error('Failed to load configuration file', e)
    return null
  }
}
