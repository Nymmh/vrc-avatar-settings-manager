import { Database } from 'better-sqlite3'
import { generateNextPresetNumber } from '../helpers/generateNextPresetNumber'

export function insertPreset(
  db: Database,
  config: avatarDBInterface,
  avatarId: string,
  avatarName: string
): void {
  if (!config.isPreset || !config.presets) return

  db.prepare(
    `INSERT INTO presets (forUqid, avatarId, name, unityParameter)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(forUqid) DO UPDATE SET
          avatarId = excluded.avatarId,
          name = excluded.name,
          unityParameter = excluded.unityParameter`
  ).run(
    config.presets.forUqid || '',
    config.presets.avatarId || avatarId,
    config.presets.name || '',
    config.presets.unityParameter
  )

  const presetNumber = generateNextPresetNumber(db, avatarId)
  const saveName = `${avatarName} Preset ${presetNumber}`

  db.prepare(`UPDATE presets SET name = ?, unityParameter = ? WHERE forUqid = ?`).run(
    saveName,
    presetNumber,
    config.presets.forUqid
  )
}
