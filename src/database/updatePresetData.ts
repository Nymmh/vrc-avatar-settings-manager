import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function updatePresetData(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  id: number,
  saveName: string,
  parameter: number
): Promise<updatePresetInterface> {
  log.info('Update preset data...')
  const userResponse = await showDialogNoSound(
    ['Yes', 'No'],
    0,
    'Update Preset',
    `Are you sure you want to update this presets?`,
    mainWindow
  )

  if (userResponse.response !== 0) {
    log.info('User cancelled preset update')
    return { success: false, message: 'Update cancelled' }
  }

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
    log.error('Preset not found')
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
    log.info('Preset with this parameter already exists')
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

    log.info('Preset updated successfully')
    return { success: true, message: 'Preset updated' }
  } catch (e) {
    log.error('Error updating preset data:', e)
    return { success: false, message: 'Error updating preset' }
  }
}
