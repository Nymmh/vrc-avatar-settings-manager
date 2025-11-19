import { dialog } from 'electron'
import { Logger } from 'electron-log'
import fs from 'fs'

export type saveConfigExport = {
  success: boolean
  filePath?: string
}

export async function saveConfig(
  log: Logger,
  mainWindow,
  content,
  fileName
): Promise<saveConfigExport> {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save File',
    defaultPath: `${fileName}.json`,
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (canceled || !filePath) {
    log.info('Save configuration canceled or no file path specified')
    return { success: false }
  }

  try {
    await fs.promises.writeFile(filePath, content, 'utf-8')

    return { success: true, filePath }
  } catch (e) {
    log.error('Error saving configuration file:', e)
    return { success: false }
  }
}
