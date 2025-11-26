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
    const parsedData = JSON.parse(data) as exportAllConfigsInterface[]

    for (const avatar of parsedData) {
      const existing = db
        .prepare('SELECT id FROM avatarStorage WHERE avatarId = ?')
        .get(avatar.avatarId)

      if (existing) {
        log.info(`Avatar with ID ${avatar.avatarId} already exists. Skipping import.`)
        continue
      }

      db.prepare(`INSERT INTO avatarStorage (avatarId, name) VALUES (?, ?)`).run(
        avatar.avatarId,
        avatar.name
      )

      if (!avatar.configs) continue

      for (const c of avatar.configs) {
        db.prepare(
          `INSERT INTO avatars (uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
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
          db.prepare(
            `INSERT INTO presets (forUqid, avatarId, name, unityParameter) VALUES (?, ?, ?, ?)`
          ).run(
            c.presets.forUqid,
            c.presets.avatarId,
            c.presets.name,
            c.presets.unityParameter || null
          )
        }
      }
    }

    return {
      success: true,
      message: 'Import completed successfully'
    }
  } catch (e) {
    log.error('Import All Configs Error: ', e)
    return { success: false, message: 'Import All Configs Error' }
  }
}
