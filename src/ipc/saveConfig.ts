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
  content: avatarConfigInterface | string,
  saveName: string,
  overwrite: boolean,
  nsfw: boolean,
  fromFile: boolean,
  mainWindow: BrowserWindow
): Promise<saveConfigInterface> {
  try {
    saveName = saveName.trim()
    if (!saveName) {
      return { success: false, message: 'Invalid config name' }
    }

    const parsedContent: avatarConfigInterface =
      typeof content === 'string' ? JSON.parse(content) : content

    if (!parsedContent || !parsedContent.id || !Array.isArray(parsedContent.animationParameters))
      return { success: false, message: 'Invalid config' }

    const nsfwValue = nsfw ? 1 : 0
    const fromFileValue = fromFile ? 1 : 0
    const parametersJson = JSON.stringify(parsedContent.animationParameters)
    const uqid = generateUqid(parsedContent?.id || 'unknown')
    let uploadedPresets = false

    if (!fromFile && parsedContent.id.trim()) {
      const existing = checkIfExistByNameAndAvatarId(db, saveName, parsedContent.id)

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
        set avatarName = ?, nsfw = ?, parameters = ?, fromFile = 0
        WHERE name = ? AND avatarId = ?
      `
        ).run(
          parsedContent?.name || 'Unknown',
          nsfwValue,
          parametersJson,
          saveName,
          parsedContent.id
        )

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
            presetSave = await uploadAvatarPresets(db, parsedContent, mainWindow, uqid, true)
            uploadedPresets = true
          }

          db.prepare(
            `
        UPDATE avatars
        SET avatarName = ?, nsfw = ?, parameters = ?, fromFile = 1, isPreset = ?
        WHERE uqid = ?
      `
          ).run(
            parsedContent?.name?.trim() || 'Unknown',
            nsfwValue,
            parametersJson,
            presetSave ? 1 : 0,
            parsedContent.uqid
          )
        } else if (userResponse.response === 1) {
          parsedContent.uqid = undefined
        }
      }
    }

    let uploadName = saveName
    let counter = 1

    while (checkIfExistByNameAndAvatarId(db, uploadName, parsedContent.id)) {
      uploadName = `${saveName} (${counter})`
      counter++
    }

    saveName = uploadName

    let presetSave = parsedContent.isPreset

    if (parsedContent.isPreset && parsedContent?.presets?.avatarId && !uploadedPresets) {
      presetSave = await uploadAvatarPresets(
        db,
        parsedContent,
        mainWindow,
        parsedContent?.uqid || uqid,
        false
      )
    }

    db.prepare(
      `
      INSERT INTO avatars (uqid, avatarId, name, avatarName, nsfw, parameters, fromFile, isPreset)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uqid) DO UPDATE SET
        avatarId = excluded.avatarId,
        avatarName = excluded.avatarName,
        nsfw = excluded.nsfw,
        parameters = excluded.parameters,
        fromFile = excluded.fromFile,
        isPreset = excluded.isPreset
    `
    ).run(
      parsedContent?.uqid || uqid,
      parsedContent.id,
      saveName,
      parsedContent.name,
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
    ).run(parsedContent.id, parsedContent.name)

    return { success: true, message: 'Saved' }
  } catch (e) {
    log.error('Saving Error: ', e)
    return { success: false, message: 'Database error' }
  }
}
