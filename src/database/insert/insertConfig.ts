import { Database } from 'better-sqlite3'

export function insertConfig(
  db: Database,
  config: avatarDBInterface,
  avatarName: string,
  parameters: string
): void {
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
}
