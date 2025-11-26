import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { checkIfPresetExists } from './checkifPresetExists'
import { createPreset } from './createPreset'
import { BrowserWindow } from 'electron'

export async function updatePreset(
  log: Logger,
  db: Database,
  presetId: number,
  avatarId: string,
  pendingChanges: Map<string, unknown>,
  mainWindow: BrowserWindow
): Promise<void> {
  try {
    await createPreset(log, db, avatarId, presetId, pendingChanges, mainWindow)
  } catch (e) {
    log.error('Error updating preset:', e)
  }
}
