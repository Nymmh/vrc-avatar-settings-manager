import { BrowserWindow, Dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { checkDataFolder } from './checkDataFolder'

export async function exportAvatar(
  log: Logger,
  db: Database,
  dialog: Dialog,
  mainWindow: BrowserWindow,
  avatarId: string
): Promise<exportAvatarInterface> {
  try {
    if (!avatarId || typeof avatarId !== 'string' || avatarId.trim() === '') {
      return { success: false, message: 'Invalid Avatar ID provided' }
    }

    const q = db
      .prepare('SELECT avatarId,name FROM avatarStorage WHERE avatarId = ? LIMIT 1')
      .get(avatarId) as avatarStorageDBInterface | undefined

    if (!q) return { success: false, message: 'No avatar found' }

    const { avatarData } = checkDataFolder()

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Avatar',
      defaultPath: `${path.join(avatarData, `avatar_${q.name || ''}`)}.json`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (canceled || !filePath) {
      log.error('Export configuration canceled or no file path specified')
      return { success: false, message: 'Export configuration canceled or no file path specified' }
    }

    const a = db
      .prepare(
        'SELECT uqid, avatarId, name, avatarName, nsfw, parameters, isPreset FROM avatars WHERE avatarId = ?'
      )
      .all(avatarId) as avatarDBInterface[] | undefined

    if (!a) return { success: false, message: 'No avatar configuration found' }

    for (const av of a) {
      const p = db
        .prepare('SELECT avatarId, name, unityParameter FROM presets WHERE forUqid = ? LIMIT 1')
        .get(av.uqid) as avatarPresetsInterface | undefined

      av.presets = {
        forUqid: av.uqid,
        avatarId: p?.avatarId || '',
        name: p?.name || '',
        unityParameter: p?.unityParameter || 0
      }
    }

    const exportData = {
      type: 'avatar',
      avatarId: q.avatarId,
      name: q.name,
      configs: a
    }

    await fs.promises.writeFile(filePath, JSON.stringify(exportData), 'utf-8')

    return { success: true, message: 'Config exported' }
  } catch (e) {
    log.error('Error exporting avatar:', e)
    return { success: false, message: 'Error exporting avatar' }
  }
}
