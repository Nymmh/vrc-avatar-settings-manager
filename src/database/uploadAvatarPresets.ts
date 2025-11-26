import Database from 'better-sqlite3'
import { showWarning } from '../services/showWarning'
import { BrowserWindow } from 'electron'

export async function uploadAvatarPresets(
  db: Database,
  avatarConfig: avatarConfigInterface,
  mainWindow: BrowserWindow,
  uqid: string,
  update: boolean
): Promise<number> {
  try {
    const userResponse = await showWarning(
      ['Yes', 'No'],
      0,
      'Presets found',
      `Preset data found in the config. Do you want to ${update ? 'update' : 'upload'} the preset?`,
      mainWindow
    )

    if (userResponse.response !== 0) {
      return 0
    }

    if (update) {
      db.prepare(
        `
        UPDATE presets
        SET avatarId = ?, name = ?, unityParameter = ?
        WHERE foruqId = ?
      `
      ).run(
        avatarConfig.presets?.avatarId,
        avatarConfig.presets?.name,
        avatarConfig.presets?.unityParameter,
        uqid
      )
    } else {
      db.prepare(
        `
          INSERT INTO presets (foruqId, avatarId, name, unityParameter)
          VALUES (?, ?, ?, ?)
        `
      ).run(
        uqid,
        avatarConfig.presets?.avatarId,
        avatarConfig.presets?.name,
        avatarConfig.presets?.unityParameter
      )
    }

    return 1
  } catch {
    return 0
  }
}
