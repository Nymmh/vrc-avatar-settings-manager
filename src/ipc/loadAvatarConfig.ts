import { BrowserWindow, dialog } from 'electron'
import { Logger } from 'electron-log'
import fs from 'fs'
import { checkDataFolder } from '../file/checkDataFolder'

export async function loadAvatarConfig(
  log: Logger,
  mainWindow: BrowserWindow
): Promise<exportAllConfigsInterface | string | null> {
  const dataFolder = checkDataFolder()

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select an Avatar Share Code or JSON',
    defaultPath: dataFolder.avatarData,
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
    log.info('Load configuration canceled or no file selected')
    return null
  }

  try {
    const data = await fs.readFileSync(filePaths[0], 'utf-8')
    try {
      return JSON.parse(data) as exportAllConfigsInterface
    } catch {
      return data
    }
  } catch (e) {
    log.error('Failed to load configuration file', e)
    return null
  }
}
