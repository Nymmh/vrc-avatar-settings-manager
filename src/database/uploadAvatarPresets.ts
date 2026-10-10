import Database from 'better-sqlite3'
import { generateNextPresetNumber } from './helpers/generateNextPresetNumber'
import { Logger } from 'electron-log'

export function uploadAvatarPresets(
  db: Database,
  avatarConfig: avatarDBInterface,
  uqid: string,
  update: boolean,
  log: Logger
): number {
  try {
    log.info('Uploading avatar presets')
    if (update) {
      log.info('Updating existing presets')
    } else {
      log.info('Uploading new presets')
      const existingCheck = db
        .prepare(`SELECT id FROM presets WHERE avatarId = ? AND unityParameter = ? LIMIT 1`)
        .get(avatarConfig.presets?.avatarId, avatarConfig.presets?.unityParameter)

      if (existingCheck && avatarConfig.presets?.avatarId) {
        const nextPresetNumber = generateNextPresetNumber(db, avatarConfig.presets.avatarId)
        avatarConfig.presets.unityParameter = nextPresetNumber
      }
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

    return 1
  } catch (e) {
    log.error('Error uploading avatar presets:', e)
    throw e
  }
}
