import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { avatarConfig } from '../services/avatarConfig'
import { BrowserWindow } from 'electron'
import { checkIfPresetExists } from './checkIfPresetExists'
import { generateUqid } from '../helpers/generateUqid'

export async function createPreset(
  log: Logger,
  db: Database,
  avatarId: string,
  presetId: number,
  pendingChanges: Map<string, unknown>,
  mainWindow: BrowserWindow,
  name?: string
): Promise<void> {
  try {
    log.info('Trying to create preset...')
    const aviData = await avatarConfig(db, avatarId, mainWindow, pendingChanges, log)

    db.transaction(() => {
      const existingUqid = checkIfPresetExists(db, avatarId, presetId, log)
      const uqid = existingUqid || generateUqid(avatarId)

      db.prepare(
        `
      INSERT INTO avatarStorage (avatarId, name)
      VALUES (?, ?)
      ON CONFLICT(avatarId) DO NOTHING
      `
      ).run(avatarId, aviData?.name || 'Unknown')

      const presetName = name === undefined ? aviData?.name + ' Preset ' + presetId : name

      db.prepare(
        `
      INSERT INTO avatars (uqid, avatarId, name, avatarName, parameters, fromFile, isPreset)
      VALUES (?, ?, ?, ?, ?, 0, 1)
      ON CONFLICT(uqid) DO UPDATE SET
        parameters = excluded.parameters,
        avatarName = excluded.avatarName,
        fromFile = 0,
        name = CASE 
          WHEN excluded.name != '' THEN excluded.name
          ELSE name
        END
        `
      ).run(
        uqid,
        avatarId,
        presetName,
        aviData?.name || '',
        JSON.stringify(aviData?.valuedParams || [])
      )

      if (!existingUqid) {
        db.prepare(
          `
        INSERT INTO presets (forUqid, avatarId, name, unityParameter)
        VALUES (?, ?, ?, ?)
        `
        ).run(uqid, avatarId, presetName, presetId)
      }
    })()

    mainWindow.webContents.send('dataTableRefresh')

    log.info('Preset created/updated successfully')
  } catch (e) {
    log.error('Error creating/updating preset:', e)
  }
}
