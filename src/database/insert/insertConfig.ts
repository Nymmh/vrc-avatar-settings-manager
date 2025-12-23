import { Database } from 'better-sqlite3'
import { Logger } from 'electron-log'

export function insertConfig(
  db: Database,
  config: avatarDBInterface,
  avatarName: string,
  parameters: string,
  log: Logger
): void {
  try {
    log.info(`Inserting config...`)

    db.prepare(
      `INSERT INTO avatars (uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(uqid) DO UPDATE SET
          avatarId = excluded.avatarId,
          name = excluded.name,
          avatarName = excluded.avatarName,
          nsfw = excluded.nsfw,
          parameters = excluded.parameters,
          fromFile = excluded.fromFile,
          isPreset = excluded.isPreset`
    ).run(
      config.uqid,
      config.avatarId,
      config.name,
      avatarName,
      config.nsfw ? 1 : 0,
      parameters,
      1,
      config.isPreset ? 1 : 0
    )

    log.info(`Config inserted successfully`)
  } catch (e) {
    log.error(`Failed to insert config: ${e}`)
  }
}
