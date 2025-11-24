import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { checkIfPresetExists } from './checkifPresetExists'
import { createPreset } from './createPreset'
import { BrowserWindow } from 'electron'

export function updatePreset(
  log: Logger,
  db: Database,
  presetId: number,
  avatarId: string,
  pendingChanges: Map<string, unknown>,
  mainWindow: BrowserWindow,
  name?: string | undefined
): void {
  try {
    const exists = checkIfPresetExists(db, avatarId, presetId)

    if (!exists) {
      createPreset(log, db, avatarId, presetId, pendingChanges, mainWindow, undefined)
    } else {
      db.prepare(
        `UPDATE presets
         SET name = ?, unityParameter = ?`
      ).run(name ?? 'Preset ' + presetId, presetId)
    }
  } catch (e) {
    log.error('Error updating preset:', e)
  }
}
