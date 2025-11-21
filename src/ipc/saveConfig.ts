import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { saveConfigInterface } from '../types/saveConfigInterface'
import { checkIfExist } from '../database/checkIfExist'

export async function saveConfig(
  log: Logger,
  db: Database,
  content: avatarConfigInterface | string,
  saveName: string,
  overwrite: boolean,
  nsfw: boolean,
  fromFile: boolean
): Promise<saveConfigInterface> {
  try {
    if (!saveName || typeof saveName !== 'string' || saveName.trim().length === 0) {
      return { success: false, message: 'Invalid config name' }
    }

    if (typeof nsfw !== 'boolean') {
      return { success: false, message: 'Invalid NSFW input' }
    }

    const parsedContent: avatarConfigInterface =
      typeof content === 'string' ? JSON.parse(content) : content

    if (
      !parsedContent ||
      !parsedContent.id ||
      !parsedContent.name ||
      !Array.isArray(parsedContent.animationParameters)
    ) {
      return { success: false, message: 'Invalid config' }
    }

    const existing = await checkIfExist(db, saveName)

    if (existing && !overwrite) {
      if (!overwrite) {
        return { success: false, overwriteMessage: 'Config with that name exists' }
      }

      db.prepare(
        `
      UPDATE avatars
      SET avatarId = ?, avatarName = ?, nsfw = ?, parameters = ?, fromFile = ?
      WHERE name = ?
    `
      ).run(
        parsedContent.id,
        parsedContent.name,
        nsfw ? 1 : 0,
        JSON.stringify(parsedContent.animationParameters),
        saveName,
        fromFile ? 1 : 0
      )
    } else {
      db.prepare(
        `
      INSERT INTO avatars (avatarId, name, avatarName, nsfw, parameters, fromFile)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        avatarId = excluded.avatarId,
        avatarName = excluded.avatarName,
        nsfw = excluded.nsfw,
        parameters = excluded.parameters,
        fromFile = excluded.fromFile
    `
      ).run(
        parsedContent.id,
        saveName,
        parsedContent.name,
        nsfw ? 1 : 0,
        JSON.stringify(parsedContent.animationParameters),
        fromFile ? 1 : 0
      )
    }

    return { success: true, message: 'Saved' }
  } catch (e) {
    log.error('Saving Error: ', e)
    return { success: false, message: 'Database error' }
  }
  // const dataFolder = checkDataFolder()

  // const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
  //   title: 'Save File',
  //   defaultPath: `${path.join(dataFolder.avatarData, saveName)}.json`,
  //   filters: [
  //     { name: 'JSON', extensions: ['json'] },
  //     { name: 'All Files', extensions: ['*'] }
  //   ]
  // })

  // if (canceled || !filePath) {
  //   log.info('Save configuration canceled or no file path specified')
  //   return { success: false }
  // }

  // try {
  //   await fs.promises.writeFile(filePath, content, 'utf-8')

  //   return { success: true, filePath }
  // } catch (e) {
  //   log.error('Error saving configuration file:', e)
  //   return { success: false }
  // }
}
