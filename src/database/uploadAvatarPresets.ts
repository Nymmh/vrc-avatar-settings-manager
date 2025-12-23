import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { generateNextPresetNumber } from './helpers/generateNextPresetNumber'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { Logger } from 'electron-log'

export async function uploadAvatarPresets(
  db: Database,
  avatarConfig: avatarDBInterface,
  mainWindow: BrowserWindow,
  uqid: string,
  update: boolean,
  log: Logger
): Promise<number> {
  try {
    log.info('Uploading avatar presets')
    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Presets found',
      `Preset data found in the config. Do you want to ${update ? 'update' : 'upload'} the preset?`,
      mainWindow
    )

    if (userResponse.response !== 0) return 0

    if (update) {
      log.info('Updating existing presets')
      db.prepare(
        `
          INSERT INTO presets (forUqid, avatarId, name, unityParameter)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(forUqid) DO UPDATE SET
            avatarId = excluded.avatarId,
            name = excluded.name,
            unityParameter = excluded.unityParameter 
        `
      ).run(
        uqid,
        avatarConfig.presets?.avatarId,
        avatarConfig.presets?.name,
        avatarConfig.presets?.unityParameter
      )
    } else {
      log.info('Uploading new presets')
      const existingCheck = db
        .prepare(`SELECT id FROM presets WHERE avatarId = ? AND unityParameter = ? LIMIT 1`)
        .get(avatarConfig.presets?.avatarId, avatarConfig.presets?.unityParameter)

      if (existingCheck && avatarConfig.presets?.avatarId) {
        const nextPresetNumber = generateNextPresetNumber(db, avatarConfig.presets.avatarId)
        avatarConfig.presets!.unityParameter = nextPresetNumber
      }

      db.prepare(
        `
          INSERT INTO presets (forUqid, avatarId, name, unityParameter)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(forUqid) DO UPDATE SET
            avatarId = excluded.avatarId,
            name = excluded.name,
            unityParameter = excluded.unityParameter 
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
