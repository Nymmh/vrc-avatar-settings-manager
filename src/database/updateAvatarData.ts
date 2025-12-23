import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { syncAvatarNames } from './syncAvatarNames'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { generateNextPresetNumber } from './helpers/generateNextPresetNumber'

export async function updateAvatarData(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  avatarId: string,
  avatarName: string,
  updateId: string
): Promise<updateAvatarDataInterface> {
  try {
    if (!avatarId || !avatarName || !updateId) {
      return { success: false, message: 'Avatar ID and name are required' }
    }

    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Update Avatar',
      `Are you sure you want to update this avatar?`,
      mainWindow
    )

    if (userResponse.response !== 0) return { success: false, message: 'Update cancelled' }

    const q = db.prepare('UPDATE avatarStorage SET name = ? WHERE avatarId = ?')
    const result = q.run(avatarName, avatarId)

    console.log(updateId)
    console.log(avatarId)

    if (updateId !== avatarId) {
      const avatarStorageSearch = db.prepare(
        'SELECT avatarId FROM avatarStorage WHERE avatarId = ? LIMIT 1'
      )
      const avatarStorageExists = avatarStorageSearch.get(updateId)
      if (!avatarStorageExists) {
        const asu = db.prepare('UPDATE avatarStorage SET avatarId = ? WHERE avatarId = ?')
        asu.run(updateId, avatarId)

        const au = db.prepare('UPDATE avatars SET avatarId = ? WHERE avatarId = ?')
        au.run(updateId, avatarId)

        const pu = db.prepare('UPDATE presets SET avatarId = ? WHERE avatarId = ?')
        pu.run(updateId, avatarId)
      } else {
        const au = db.prepare('UPDATE avatars SET avatarId = ? WHERE avatarId = ?')
        au.run(updateId, avatarId)

        const presetsToUpdate = db
          .prepare('SELECT id, unityParameter FROM presets WHERE avatarId = ?')
          .all(avatarId) as { id: number; unityParameter: number }[]

        for (const preset of presetsToUpdate) {
          const presetNumber = generateNextPresetNumber(db, avatarId)

          db.prepare('UPDATE presets SET avatarId = ?, unityParameter = ? WHERE id = ?').run(
            updateId,
            presetNumber,
            preset.id
          )
        }

        const das = db.prepare('DELETE FROM avatarStorage WHERE avatarId = ?')
        das.run(avatarId)
      }
    }

    if (result.changes === 0) {
      return { success: false, message: 'No avatar found with the provided ID' }
    }

    syncAvatarNames(log, db, avatarId)

    return { success: true }
  } catch (e) {
    log.info('Error updating avatar data:', e)
    return { success: false, message: 'Error updating avatar data' }
  }
}
