import { BrowserWindow, Dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { checkDataFolder } from './checkDataFolder'

export async function exportConfig(
  log: Logger,
  db: Database,
  dialog: Dialog,
  mainWindow: BrowserWindow,
  id: number
): Promise<exportConfigInterface> {
  try {
    if (!id || typeof id !== 'number' || id <= 0)
      return { success: false, message: 'Invalid ID provided' }

    const q = db
      .prepare(
        'SELECT uqid, avatarId, name, avatarName, nsfw, parameters FROM avatars WHERE id = ? LIMIT 1'
      )
      .get(id) as avatarDBInterface | undefined

    if (!q) return { success: false, message: 'No config found' }

    const { avatarData } = checkDataFolder()

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Config',
      defaultPath: `${path.join(avatarData, q.name || '')}.json`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (canceled || !filePath) {
      log.error('Export configuration canceled or no file path specified')
      return { success: false, message: 'Export configuration canceled or no file path specified' }
    }

    let parsed: unknown[] = []
    try {
      parsed = JSON.parse(q.parameters) || []
    } catch {
      log.warn('Invalid JSON')
    }

    const exportData = {
      id: q.avatarId || 'Unknown',
      uqid: q.uqid || '',
      name: q.name || new Date().toISOString(),
      avatarName: q.avatarName || 'Unknown',
      nsfw: !!q.nsfw,
      animationParameters: parsed
    }

    await fs.promises.writeFile(filePath, JSON.stringify(exportData), 'utf-8')

    return { success: true, message: 'Config exported' }
  } catch (error) {
    log.error('Error exporting config:', error)
    return { success: false, message: 'Error exporting config' }
  }
}
