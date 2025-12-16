import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { loadConfig } from '../ipc/loadConfig'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function replaceParams(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  id: number
): Promise<replaceParamsInterface> {
  try {
    if (!id || id <= 0) return { success: false, message: 'Invalid ID' }

    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Replace Parameters',
      `Are you sure you want to replace the avatar parameters? This action cannot be undone.`,
      mainWindow
    )

    if (userResponse.response !== 0) return { success: false, message: 'Replace cancelled' }

    const parsedConfig = await loadConfig(log, mainWindow)

    if (!parsedConfig) return { success: false, message: 'No file data' }

    const q = db.prepare('SELECT avatarId FROM avatars WHERE id = ? LIMIT 1').get(id) as
      | {
          avatarId: string
        }
      | undefined

    if (!q) return { success: false, message: 'No saved config found with that ID' }

    if (parsedConfig?.avatarId?.trim() && parsedConfig.avatarId.trim() !== q.avatarId) {
      const userResponse = await showDialogNoSound(
        ['Yes', 'No'],
        0,
        'Avatar ID Mismatch',
        `The avatar ID's do not match. Uploading this configuration may lead to unexpected results. Do you want to proceed?`,
        mainWindow
      )

      if (userResponse.response !== 0) return { success: false, message: 'Cancelled' }
    }

    if (parsedConfig.nsfw) {
      const userResponse = await showDialogNoSound(
        ['Yes', 'No'],
        0,
        'NSFW Warning',
        `The uploaded configuration is marked as NSFW. Are you sure you want to proceed?`,
        mainWindow
      )

      if (userResponse.response !== 0) return { success: false, message: 'Cancelled' }
    }

    db.prepare('UPDATE avatars SET parameters = ?, fromFile = 1 WHERE id = ?').run(
      JSON.stringify(parsedConfig.valuedParams) || '[]',
      id
    )

    return { success: true, message: 'Parameters replaced' }
  } catch (e) {
    log.info('Error replacing parameters:', e)
    return { success: false, message: 'Error replacing parameters' }
  }
}
