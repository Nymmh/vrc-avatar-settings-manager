import { BrowserWindow, Dialog } from 'electron'
import { Logger } from 'electron-log'
import path from 'path'
import fs from 'fs'
import { checkDataFolder } from './checkDataFolder'

export async function exportShareCode(
  log: Logger,
  dialog: Dialog,
  mainWindow: BrowserWindow,
  data: string,
  avatarName: string,
  name: string
): Promise<exportConfigInterface> {
  try {
    log.info(`Starting export of share code`)

    const { avatarConfigData } = checkDataFolder()

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Config',
      defaultPath: `${path.join(avatarConfigData, `sharecode_config_${avatarName}_${name || ''}`)}.txt`,
      filters: [
        { name: 'TXT', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (canceled || !filePath) {
      log.info('Export canceled or no file path specified')
      return { success: false, message: 'Export canceled or no file path specified' }
    }

    await fs.promises.writeFile(filePath, data, 'utf-8')

    log.info(`Share Code exported successfully`)
    return { success: true, message: 'Share Code exported' }
  } catch (e) {
    log.error(`Error exporting share code: ${e}`)
    return { success: false, message: 'Error exporting share code' }
  }
}
