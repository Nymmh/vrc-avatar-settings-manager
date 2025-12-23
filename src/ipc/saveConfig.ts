import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { saveConfigInterface } from '../types/saveConfigInterface'
import { checkIfExist } from '../database/checkIfExist'
import { checkIfExistByNameAndAvatarId } from '../database/checkIfExistByNameAndAvatarId'
import { BrowserWindow } from 'electron'
import { uploadAvatarPresets } from '../database/uploadAvatarPresets'
import { generateUniqueUqid } from '../database/helpers/generateUniqueUqid'
import { getNextDuplicateNumber } from '../database/helpers/getNextDuplicateNumber'
import { getAvatarName } from '../database/helpers/getAvatarName'
import { showDialogNoSound } from '../services/showDialogNoSound'

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
      log.error('Invalid config name')
      return { success: false, message: 'Invalid config name' }
    }

    const parsedContent: avatarDBInterface =
      typeof content === 'string' ? JSON.parse(content) : content

    if (!parsedContent?.avatarId) {
      log.error('Invalid config data')
      return { success: false, message: 'Invalid config' }
    }

    const parametersJson =
      typeof parsedContent.valuedParams === 'string'
        ? parsedContent.valuedParams
        : JSON.stringify(parsedContent.valuedParams || [])
    const uqid = generateUniqueUqid(db)
    let uploadedPresets = false

    if (!fromFile && parsedContent.avatarId.trim()) {
      log.info('Saving config from non-file source')
      const existing = checkIfExistByNameAndAvatarId(db, saveName, parsedContent.avatarId)

      if (existing) {
        const userResponse = await showDialogNoSound(
          ['Yes', 'No'],
          0,
          'Avatar Config Exists',
          `A config with that name for this avatar already exists. Do you want to overwrite it?`,
          mainWindow
        )

        if (userResponse.response !== 0) {
          log.info('Save cancelled by user')
          return { success: false, message: 'Save cancelled' }
        }

        db.prepare(
          `
        UPDATE avatars
        SET nsfw = ?, parameters = ?, fromFile = 0
        WHERE name = ? AND avatarId = ?
      `
        ).run(nsfw ? 1 : 0, parametersJson, saveName, parsedContent.avatarId)

        log.info('Config overwritten successfully')
        return { success: true, message: 'Saved' }
      }
    } else if (fromFile && parsedContent.uqid?.trim()) {
      if (checkIfExist(db, parsedContent.uqid)) {
        log.info('Config with uqid exists, prompting for overwrite')
        const userResponse = await showDialogNoSound(
          ['Yes', 'No', 'Cancel Upload'],
          0,
          'Avatar Config Exists',
          `A config with that id already exists. Do you want to overwrite it?`,
          mainWindow
        )

        if (userResponse.response === 2) {
          log.info('Save cancelled by user')
          return { success: false, message: 'Save cancelled' }
        }

        if (userResponse.response === 0) {
          log.info('User chose to overwrite existing config')
          let presetSave = parsedContent.isPreset

          if (parsedContent.isPreset && parsedContent?.presets?.avatarId) {
            log.info('Uploading associated presets')
            presetSave = await uploadAvatarPresets(
              db,
              parsedContent,
              mainWindow,
              parsedContent.uqid,
              true,
              log
            )
            uploadedPresets = true
          }

          log.info('Updating existing config in database')
          db.prepare(
            `
        UPDATE avatars
        SET name = ?, nsfw = ?, parameters = ?, fromFile = 1, isPreset = ?
        WHERE uqid = ? 
        `
          ).run(
            saveName || 'Unknown',
            parsedContent.nsfw ? 1 : 0,
            parametersJson,
            presetSave ? 1 : 0,
            parsedContent.uqid
          )

          log.info('Config overwritten successfully')
          return { success: true, message: 'Saved' }
        }

        parsedContent.uqid = uqid
      }
    } else {
      log.info('Error saving config')
      return { success: false, message: 'Internal error' }
    }

    log.info('Inserting new config into database')
    const existingConfig = db
      .prepare(
        `
          SELECT id, name FROM avatars WHERE avatarId = ? LIMIT 1
          `
      )
      .get(parsedContent.avatarId) as { id: number; name: string } | undefined

    if (existingConfig?.name === saveName) {
      const dup = getNextDuplicateNumber(db, saveName)
      saveName = `${saveName} (${dup})`
    }

    let presetSave = parsedContent?.isPreset || 0

    if (parsedContent.isPreset && parsedContent.presets?.avatarId && !uploadedPresets) {
      parsedContent.presets.avatarId = parsedContent.avatarId
      presetSave = await uploadAvatarPresets(
        db,
        parsedContent,
        mainWindow,
        parsedContent.uqid || uqid,
        false,
        log
      )
    }

    const avatarName =
      getAvatarName(db, parsedContent.avatarId) ||
      parsedContent.avatarName?.trim() ||
      parsedContent.name?.trim() ||
      'Unknown'

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
      parsedContent.uqid || uqid,
      parsedContent.avatarId,
      saveName,
      avatarName,
      nsfw ? 1 : 0,
      parametersJson,
      fromFile ? 1 : 0,
      presetSave
    )

    db.prepare(
      `INSERT INTO avatarStorage (avatarId, name) VALUES (?, ?)
     ON CONFLICT(avatarId) DO NOTHING`
    ).run(parsedContent.avatarId, avatarName)

    log.info('Config saved successfully')
    return { success: true, message: 'Saved' }
  } catch (e) {
    log.info('Saving Error: ', e)
    return { success: false, message: 'Database error' }
  }
}
