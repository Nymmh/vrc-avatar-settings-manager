import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export async function uploadAvatar(
  log: Logger,
  db: Database,
  loadedJson: exportAllConfigsInterface
): Promise<uploadAvatarConfigInterface> {
  try {
    const parsedContent: avatarDBInterface[] =
      typeof loadedJson.configs === 'string' ? JSON.parse(loadedJson.configs) : loadedJson.configs

    db.prepare(
      `INSERT INTO avatarStorage (avatarId, name)
         VALUES (?, ?)`
    ).run(loadedJson.avatarId, loadedJson.name)

    for (const a of parsedContent) {
      db.prepare(
        `INSERT INTO avatars (uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        a.uqid,
        a.avatarId,
        a.name,
        loadedJson.name,
        a.nsfw ? 1 : 0,
        a.parameters,
        1,
        a.isPreset ? 1 : 0
      )

      db.prepare(
        `INSERT INTO presets (foruqId, avatarId, name, unityParameter)
         VALUES (?, ?, ?, ?)`
      ).run(
        a.presets?.forUqid || '',
        a.presets?.avatarId || '',
        a.presets?.name || '',
        a.presets?.unityParameter
      )
    }

    return { success: true, message: 'Saved' }
  } catch (e) {
    log.error('Saving Error: ', e)
    return { success: false, message: 'Database error' }
  }
}
