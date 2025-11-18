import { dialog } from 'electron'
import fs from 'fs'

export type saveConfigExport = {
  success: boolean
  filePath?: string
}

export async function saveConfig(mainWindow, content, fileName): Promise<saveConfigExport> {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save File',
    defaultPath: `${fileName}.json`,
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (canceled || !filePath) {
    return { success: false }
  }

  try {
    await fs.promises.writeFile(filePath, content, 'utf-8')

    return { success: true, filePath }
  } catch (e) {
    console.log(e)
    return { success: false }
  }
}
