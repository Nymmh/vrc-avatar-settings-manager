import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { saveConfigInterface } from '../types/saveConfigInterface'
import { checkIfExist } from '../database/checkIfExist'

export function saveConfig(
  log: Logger,
  db: Database,
  content: avatarConfigInterface | string,
  saveName: string,
  overwrite: boolean,
  nsfw: boolean,
  fromFile: boolean
): saveConfigInterface {
  try {
    saveName = saveName.trim()
    if (!saveName) {
      return { success: false, message: 'Invalid config name' }
    }

    const parsedContent: avatarConfigInterface =
      typeof content === 'string' ? JSON.parse(content) : content

    if (!parsedContent || !parsedContent.id || !Array.isArray(parsedContent.animationParameters))
      return { success: false, message: 'Invalid config' }

    const existing = checkIfExist(db, saveName)

    if (existing && !overwrite) {
      return { success: false, overwriteMessage: 'Config with that name exists' }
    }

    const nsfwValue = nsfw ? 1 : 0
    const fromFileValue = fromFile ? 1 : 0
    const parametersJson = JSON.stringify(parsedContent.animationParameters)

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
    ).run(parsedContent.id, saveName, parsedContent.name, nsfwValue, parametersJson, fromFileValue)

    return { success: true, message: 'Saved' }
  } catch (e) {
    log.error('Saving Error: ', e)
    return { success: false, message: 'Database error' }
  }
}
