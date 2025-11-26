import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function updatePresetData(
  log: Logger,
  db: Database,
  id: number,
  saveName: string,
  parameter: number
): updatePresetInterface {
  const existing = db
    .prepare(
      `
            SELECT forUqid,name,avatarId FROM presets
            WHERE id = ?
            LIMIT 1
        `
    )
    .get(id) as { forUqid: string; name: string; avatarId: string } | undefined

  if (!existing?.forUqid) {
    return { success: false, message: 'Preset not found' }
  }

  const presetNumberExists = db
    .prepare(
      `
        SELECT id FROM presets
        WHERE unityParameter = ? AND avatarId = ?
        LIMIT 1
      `
    )
    .get(parameter, existing.avatarId)

  if (presetNumberExists && presetNumberExists.id !== id) {
    return {
      success: false,
      message: `Preset with parameter ${parameter} already exists`
    }
  }

  if (existing.name.trim() !== saveName.trim()) {
    saveName = saveName.trim()
    let updateName = saveName
    let counter = 1

    while (true) {
      const dup = db
        .prepare(
          `
              SELECT id FROM presets WHERE name = ? AND forUqid = ? AND id != ?
            `
        )
        .get(updateName, existing.forUqid, id)

      if (!dup) break

      updateName = `${saveName} (${counter})`
      counter++
    }

    saveName = updateName
  }

  try {
    db.prepare(
      `
        UPDATE presets
        SET name = ?, unityParameter = ?
        WHERE id = ?
      `
    ).run(saveName, parameter, id)

    return { success: true, message: 'Preset updated' }
  } catch (e) {
    log.error('Error updating preset data:', e)
    return { success: false, message: 'Error updating preset' }
  }
}
