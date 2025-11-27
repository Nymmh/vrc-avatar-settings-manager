import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { saveConfigInterface } from '../types/saveConfigInterface'
import { checkIfExist } from '../database/checkIfExist'
import { generateUqid } from '../helpers/generateUqid'
import { checkIfExistByNameAndAvatarId } from '../database/checkIfExistByNameAndAvatarId'
import { BrowserWindow } from 'electron'
import { showWarning } from '../services/showWarning'
import { uploadAvatarPresets } from '../database/uploadAvatarPresets'

export async function saveConfig(
  log: Logger,
  db: Database,
  content: avatarDBInterface | string,
  saveName: string,
  nsfw: boolean,
  fromFile: boolean,
  mainWindow: BrowserWindow
): Promise<saveConfigInterface> {
  try {
    saveName = saveName.trim()
    if (!saveName) {
      return { success: false, message: 'Invalid config name' }
    }

    const parsedContent: avatarDBInterface =
      typeof content === 'string' ? JSON.parse(content) : content

    if (!parsedContent || !parsedContent.avatarId)
      return { success: false, message: 'Invalid config' }

    const nsfwValue = nsfw ? 1 : 0
    const fromFileValue = fromFile ? 1 : 0
    const parametersJson =
      (typeof parsedContent.valuedParams === 'string'
        ? parsedContent.valuedParams
        : JSON.stringify(parsedContent.valuedParams)) || '[]'
    const uqid = generateUqid(parsedContent?.avatarId || 'unknown')
    let uploadedPresets = false

    if (!fromFile && parsedContent.avatarId.trim()) {
      const existing = checkIfExistByNameAndAvatarId(db, saveName, parsedContent.avatarId)

      if (existing) {
        const userResponse = await showWarning(
          ['Yes', 'No'],
          0,
          'Avatar Config Exists',
          `A config with that name for this avatar already exists. Do you want to overwrite it?`,
          mainWindow
        )

        if (userResponse.response !== 0) {
          return { success: false, message: 'Save cancelled' }
        }

        db.prepare(
          `
        UPDATE avatars
        SET nsfw = ?, parameters = ?, fromFile = 0
        WHERE name = ? AND avatarId = ?
      `
        ).run(nsfwValue, parametersJson, saveName, parsedContent.avatarId)

        return { success: true, message: 'Saved' }
      }
    } else if (fromFile && parsedContent.uqid?.trim()) {
      if (checkIfExist(db, parsedContent.uqid)) {
        const userResponse = await showWarning(
          ['Yes', 'No', 'Cancel'],
          0,
          'Avatar Config Exists',
          `A config with that id already exists. Do you want to overwrite it?`,
          mainWindow
        )

        if (userResponse.response === 2) {
          return { success: false, message: 'Save cancelled' }
        } else if (userResponse.response === 0) {
          let presetSave = parsedContent.isPreset

          if (parsedContent.isPreset && parsedContent?.presets?.avatarId) {
            presetSave = await uploadAvatarPresets(
              db,
              parsedContent,
              mainWindow,
              parsedContent.uqid,
              true
            )
            uploadedPresets = true
          }

          db.prepare(
            `
        UPDATE avatars
        SET name = ?, nsfw = ?, parameters = ?, fromFile = 1, isPreset = ?
        WHERE uqid = ?
      `
          ).run(
            saveName?.trim() || parsedContent?.name?.trim() || 'Unknown',
            parsedContent.nsfw ? 1 : 0,
            parametersJson,
            presetSave ? 1 : 0,
            parsedContent.uqid
          )

          return { success: true, message: 'Saved' }
        } else {
          parsedContent.uqid = uqid
        }
      }
    } else {
      log.error('Error saving config')
      return { success: false, message: 'Internal error' }
    }

    let uploadName = saveName
    let counter = 1

    while (checkIfExistByNameAndAvatarId(db, uploadName, parsedContent.avatarId)) {
      uploadName = `${saveName} (${counter})`
      counter++
    }

    saveName = uploadName

    let presetSave = parsedContent.isPreset

    if (parsedContent.isPreset && parsedContent?.presets?.avatarId && !uploadedPresets) {
      parsedContent.presets.avatarId = parsedContent.avatarId
      presetSave = await uploadAvatarPresets(
        db,
        parsedContent,
        mainWindow,
        parsedContent?.uqid || uqid,
        false
      )
    }

    const avatarName = db
      .prepare('SELECT name FROM avatarStorage WHERE avatarId = ? LIMIT 1')
      .get(parsedContent.avatarId) as
      | {
          name: string
        }
      | undefined

    if (avatarName?.name) {
      parsedContent.avatarName = avatarName.name
    } else {
      parsedContent.avatarName = parsedContent?.name
    }

    db.prepare(
      `
      INSERT INTO avatars (uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uqid) DO UPDATE SET
        avatarId = excluded.avatarId,
        avatarName = excluded.avatarName,
        name = excluded.name,
        nsfw = excluded.nsfw,
        parameters = excluded.parameters,
        fromFile = excluded.fromFile,
        isPreset = excluded.isPreset
    `
    ).run(
      parsedContent?.uqid || uqid,
      parsedContent.avatarId,
      saveName,
      parsedContent.avatarName?.trim() || parsedContent?.name?.trim() || 'Unknown',
      nsfwValue,
      parametersJson,
      fromFileValue,
      presetSave ? 1 : 0
    )

    db.prepare(
      `
      INSERT INTO avatarStorage (avatarId, name) VALUES (?, ?)
      ON CONFLICT(avatarId) DO NOTHING
      `
    ).run(
      parsedContent.avatarId,
      parsedContent.avatarName?.trim() || parsedContent?.name?.trim() || 'Unknown'
    )

    return { success: true, message: 'Saved' }
  } catch (e) {
    log.error('Saving Error: ', e)
    return { success: false, message: 'Database error' }
  }
}
