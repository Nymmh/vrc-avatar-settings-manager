import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { avatarConfig } from '../services/avatarConfig'
import { BrowserWindow } from 'electron'
import { checkIfPresetExists } from './checkifPresetExists'
import { generateUqid } from '../helpers/generateUqid'

export async function createPreset(
  log: Logger,
  db: Database,
  avatarId: string,
  presetId: number,
  pendingChanges: Map<string, unknown>,
  mainWindow: BrowserWindow,
  name?: string | undefined
): Promise<void> {
  try {
    const existing = checkIfPresetExists(db, avatarId, presetId)
    let uqid: string

    if (existing) {
      uqid = existing
    } else {
      uqid = generateUqid(avatarId)
    }

    const aviData = await avatarConfig(avatarId, mainWindow, pendingChanges)

    db.prepare(
      `
      INSERT INTO avatars (uqid, avatarId, name, avatarName, parameters)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uqid) DO UPDATE SET
        parameters = excluded.parameters,
        avatarName = excluded.avatarName,
        name = CASE 
          WHEN excluded.name != '' THEN excluded.name
          ELSE name
        END
    `
    ).run(
      uqid,
      avatarId,
      name || aviData?.name + ' Preset ' + presetId,
      aviData?.name || '',
      JSON.stringify(aviData?.animationParameters || [])
    )

    if (!existing) {
      db.prepare(
        `
        INSERT INTO presets (forUqid, avatarId, name, unityParameter)
        VALUES (?, ?, ?, ?)
      `
      ).run(uqid, avatarId, name || aviData?.name + ' Preset ' + presetId, presetId)
    }

    log.info('Preset created/updated successfully')
  } catch (e) {
    log.error('Error creating/updating preset:', e)
  }
}
