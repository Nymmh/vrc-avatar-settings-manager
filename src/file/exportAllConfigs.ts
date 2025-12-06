import { BrowserWindow, Dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { checkDataFolder } from './checkDataFolder'
import path from 'path'
import fs from 'fs'

export async function exportAllConfigs(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  dialog: Dialog
): Promise<exportAllConfigsPromiseInterface> {
  try {
    const a = db
      .prepare(`SELECT avatarId, name FROM avatarStorage`)
      .all() as exportAllConfigsInterface[]

    if (a.length === 0) {
      return { success: false, message: 'No avatars found to export.' }
    }

    const { fullExport } = checkDataFolder()

    const now = new Date()
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`
    const fileName = `asm-export-${timestamp}`

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Config',
      defaultPath: `${path.join(fullExport, fileName)}.json`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (canceled || !filePath) {
      log.error('Export configuration canceled or no file path specified')
      return { success: false, message: 'Export configuration canceled or no file path specified' }
    }

    for (const aa of a) {
      const q = db
        .prepare(
          'SELECT uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset FROM avatars WHERE avatarId = ?'
        )
        .all(aa.avatarId) as avatarDBInterface[]

      aa.configs = []

      for (const qq of q) {
        if (qq.isPreset === 1) {
          const p = db
            .prepare(
              `SELECT forUqid, avatarId, name, unityParameter FROM presets WHERE forUqid = ?`
            )
            .get(qq.uqid) as avatarPresetsInterface

          qq.presets = p
        }

        aa.configs.push(qq)
      }
    }

    await fs.promises.writeFile(filePath, JSON.stringify(a), 'utf-8')

    return { success: true, message: 'Config exported' }
  } catch (e) {
    log.error('Error exporting all configs:', e)
    return { success: false, message: 'An error occurred during export.' }
  }
}
