import { BrowserWindow, dialog } from 'electron'
import { Logger } from 'electron-log'
import fs from 'fs'
import { checkDataFolder } from '../file/checkDataFolder'

export async function loadConfig(
  log: Logger,
  mainWindow: BrowserWindow
): Promise<avatarDBInterface | string | null> {
  const dataFolder = checkDataFolder()

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select a config',
    defaultPath: dataFolder.avatarConfigData,
    filters: [
      {
        name: 'JSON, TXT Files',
        extensions: ['json', 'txt']
      },
      {
        name: 'JSON Files',
        extensions: ['json']
      },
      {
        name: 'Text Files',
        extensions: ['txt']
      },
      {
        name: 'All Files',
        extensions: ['*']
      }
    ],
    properties: ['openFile']
  })

  if (canceled || filePaths.length === 0) {
    log.warn('Load configuration canceled or no file selected')
    return null
  }

  try {
    const data = await fs.readFileSync(filePaths[0], 'utf-8')
    try {
      const parsed = JSON.parse(data)
      return parsed as avatarDBInterface
    } catch {
      return data
    }
  } catch (e) {
    log.error('Failed to load configuration file', e)
    return null
  }
}
