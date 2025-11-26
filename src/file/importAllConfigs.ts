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
    const parsedData = JSON.parse(data) as loadAvatarConfigFileInterface[]

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

      db.prepare(
        `INSERT INTO avatars (uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        avatar.configs.uqid,
        avatar.configs.avatarId,
        avatar.configs.name,
        avatar.configs.avatarName,
        avatar.configs.nsfw ? 1 : 0,
        avatar.configs.parameters,
        avatar.configs.fromFile ? 1 : 0,
        avatar.configs.isPreset ? 1 : 0
      )

      if (avatar.configs.isPreset === 1 && avatar.configs.presets) {
        db.prepare(
          `INSERT INTO presets (forUqid, avatarId, name, unityParameter) VALUES (?, ?, ?, ?)`
        ).run(
          avatar.configs.presets.forUqid,
          avatar.configs.presets.avatarId,
          avatar.configs.presets.name,
          avatar.configs.presets.unityParameter || null
        )
      }
    }
  } catch (e) {
    log.error('Import All Configs Error: ', e)
    return { success: false, message: 'Import All Configs Error' }
  }
}
