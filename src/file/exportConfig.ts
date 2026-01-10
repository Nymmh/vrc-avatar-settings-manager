import { BrowserWindow, Dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { checkDataFolder } from './checkDataFolder'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { getExportVersion } from '../database/getExportVersion'

export async function exportConfig(
  log: Logger,
  db: Database,
  dialog: Dialog,
  mainWindow: BrowserWindow,
  id: number
): Promise<exportConfigInterface> {
  try {
    log.info(`Starting export for config ID: ${id}`)
    if (!id || typeof id !== 'number' || id <= 0) {
      log.error('Invalid ID provided for export')
      return { success: false, message: 'Invalid ID provided' }
    }

    const q = db
      .prepare(
        'SELECT uqid, avatarId, name, avatarName, nsfw, parameters, isPreset FROM avatars WHERE id = ? LIMIT 1'
      )
      .get(id) as avatarDBInterface | undefined

    if (!q) {
      log.error('No configuration found')
      return { success: false, message: 'No config found' }
    }

    const { avatarConfigData } = checkDataFolder()

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Config',
      defaultPath: `${path.join(avatarConfigData, `config_${q.avatarName}_${q.name || ''}`)}.json`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (canceled || !filePath) {
      log.info('Export configuration canceled or no file path specified')
      return { success: false, message: 'Export configuration canceled or no file path specified' }
    }

    let savePresets = 0

    if (q.isPreset) {
      const userResponse = await showDialogNoSound(
        ['Yes', 'No'],
        0,
        'Marked As Preset',
        `This config is marked as a preset, would you like to export them too?`,
        mainWindow
      )

      if (userResponse.response === 0) savePresets = 1
    }

    let parsed: string[] = []
    const presets: Partial<avatarPresetsInterface> = {}

    if (savePresets) {
      const p = db
        .prepare('SELECT avatarId, name, unityParameter FROM presets WHERE forUqid = ? LIMIT 1')
        .get(q.uqid) as avatarPresetsInterface | undefined

      if (p) {
        presets.forUqid = q.uqid
        presets.avatarId = p.avatarId
        presets.name = p.name
        presets.unityParameter = p.unityParameter
      }
    }

    try {
      parsed = JSON.parse(q.parameters || '[]') || []
    } catch {
      log.error('Invalid JSON')
    }

    const exportVersion = getExportVersion(db, log)

    if (exportVersion === undefined) {
      log.error('Could not get export version ')
      return { success: false, message: 'Could not get export version.' }
    }

    log.info(`Export version: ${exportVersion}`)

    const exportData = {
      type: 'config',
      version: exportVersion,
      avatarId: q.avatarId || 'Unknown',
      uqid: q.uqid || '',
      name: q.name || new Date().toISOString(),
      avatarName: q.avatarName || 'Unknown',
      nsfw: !!q.nsfw,
      valuedParams: parsed,
      isPreset: !!q.isPreset,
      presets: presets
    }

    await fs.promises.writeFile(filePath, JSON.stringify(exportData), 'utf-8')

    log.info(`Config exported successfully`)
    return { success: true, message: 'Config exported' }
  } catch (error) {
    log.error('Error exporting config:', error)
    return { success: false, message: 'Error exporting config' }
  }
}
