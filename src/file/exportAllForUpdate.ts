import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { getExportVersion } from '../database/getExportVersion'
import { getBackupFolder } from './getBackupFolder'

export async function exportAllForUpdate(
  log: Logger,
  db: Database
): Promise<exportAllConfigsPromiseInterface> {
  try {
    log.info('Starting export of all avatar configs for update...')
    const exportData: exportAllDataInterface = {
      version: '',
      avatars: [] as exportAllConfigsInterface[]
    }
    const a = db
      .prepare(`SELECT avatarId, name FROM avatarStorage`)
      .all() as exportAllConfigsInterface[]

    if (a.length === 0) {
      log.error('No avatars found to export')
      return { success: false, message: 'No avatars found to export.' }
    }

    const backupFolder = getBackupFolder()
    const exportVersion = getExportVersion(db, log)

    if (exportVersion === undefined) {
      log.error('Could not get export version ')
      return { success: false, message: 'Could not get export version.' }
    }

    log.info(`Export version: ${exportVersion}`)
    exportData.version = exportVersion

    if (!backupFolder) {
      log.info('Export configuration canceled no file path specified')
      return { success: false, message: 'Export configuration canceled no file path specified' }
    }

    for (const aa of a) {
      const q = db
        .prepare(
          'SELECT uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset FROM avatars WHERE avatarId = ?'
        )
        .all(aa.avatarId) as avatarDBInterface[]

      aa.configs = []

      for (const qq of q) {
        if (qq.isPreset === 1) {
          const p = db
            .prepare(
              `SELECT forUqid, avatarId, name, unityParameter FROM presets WHERE forUqid = ?`
            )
            .get(qq.uqid) as avatarPresetsInterface

          qq.presets = p
        }

        aa.configs.push(qq)
      }
    }

    exportData.avatars = a

    const now = new Date()
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`
    const backUpFileName = `asm-backup-${timestamp}.json`
    const backUpFilePath = path.join(backupFolder, backUpFileName)

    await fs.promises.writeFile(backUpFilePath, JSON.stringify(exportData), 'utf-8')

    log.info('All avatar configs exported successfully')
    return { success: true, message: 'Config exported' }
  } catch (e) {
    log.error('Error exporting all configs:', e)
    return { success: false, message: 'An error occurred during export.' }
  }
}
