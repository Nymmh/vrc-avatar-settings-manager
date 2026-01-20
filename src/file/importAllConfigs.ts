import { Logger } from 'electron-log'
import { checkDataFolder } from './checkDataFolder'
import Database from 'better-sqlite3'
import { BrowserWindow, Dialog } from 'electron'
import fs from 'fs'

export async function importAllConfigs(
  log: Logger,
  db: Database,
  mainWindow: BrowserWindow,
  dialog: Dialog
): Promise<importAllConfigsInterface> {
  try {
    log.info('Import All Configs...')
    const dataFolder = checkDataFolder()

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select a JSON',
      defaultPath: dataFolder.fullExport,
      filters: [
        {
          name: 'JSON Files',
          extensions: ['json']
        }
      ],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) {
      log.info('Load configuration canceled or no file selected')
      return { success: false, message: 'Load configuration canceled or no file selected' }
    }

    const data = await fs.readFileSync(filePaths[0], 'utf-8')
    let parsedData = JSON.parse(data) as exportAllDataInterface

    if (!parsedData.avatars || !Array.isArray(parsedData.avatars) || !parsedData.version) {
      log.warn('Import All file is missing required data. Trying legacy support...')
      const legacySupport = parsedData as unknown as exportAllConfigsInterface[]
      parsedData = { version: 'legacy', avatars: legacySupport }

      if (!legacySupport || !Array.isArray(legacySupport)) {
        log.error('Invalid import file format')
        return { success: false, message: 'Invalid import file format' }
      }
    }

    const insertAvatar = db.prepare(
      `INSERT INTO avatarStorage (avatarId, name) VALUES (?, ?) ON CONFLICT(avatarId) DO NOTHING`
    )
    const insertConfig = db.prepare(
      `INSERT INTO avatars (uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset) VALUES (?, ?, ?, ?, ?, ?, ?, ?) on CONFLICT(uqid) DO NOTHING`
    )
    const insertPreset = db.prepare(
      `INSERT INTO presets (forUqid, avatarId, name, unityParameter) VALUES (?, ?, ?, ?) on CONFLICT(forUqid) DO NOTHING`
    )

    const insertData = db.transaction(() => {
      for (const avatar of parsedData.avatars) {
        insertAvatar.run(avatar.avatarId, avatar.name)

        if (!avatar.configs) continue

        for (const c of avatar.configs) {
          insertConfig.run(
            c.uqid,
            c.avatarId,
            c.name,
            c.avatarName,
            c.nsfw ? 1 : 0,
            c.parameters,
            c.fromFile ? 1 : 0,
            c.isPreset ? 1 : 0
          )

          if (c.isPreset === 1 && c.presets) {
            insertPreset.run(
              c.presets.forUqid,
              c.presets.avatarId,
              c.presets.name,
              c.presets.unityParameter || null
            )
          }
        }
      }
    })

    insertData()
    parsedData = null as any
    log.info('Import completed successfully')

    return {
      success: true,
      message: 'Import completed successfully'
    }
  } catch (e) {
    log.error('Import All Configs Error:', e)
    return { success: false, message: 'Import All Configs Error' }
  }
}
