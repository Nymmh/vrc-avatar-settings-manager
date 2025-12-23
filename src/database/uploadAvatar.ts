import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { generateUqid } from '../helpers/generateUqid'
import { randomString } from '../helpers/randomString'
import { generateUniqueUqid } from './helpers/generateUniqueUqid'
import { insertConfig } from './insert/insertConfig'
import { insertPreset } from './insert/insertPreset'
import { handleConfigConflict } from './helpers/handleConfigConflict'
import { getNextDuplicateNumber } from './helpers/getNextDuplicateNumber'

export async function uploadAvatar(
  log: Logger,
  db: Database,
  loadedJson: exportAllConfigsInterface,
  mainWindow: BrowserWindow
): Promise<uploadAvatarConfigInterface> {
  try {
    log.info('Starting avatar upload process')
    let loadedType: 'avatar' | 'config' = 'avatar'
    let loadedConfig: avatarDBInterface = {}
    let parsedContent: avatarDBInterface[] = []
    let configParams: string = '[]'

    if (!loadedJson.avatarId) {
      log.error('Invalid avatarId')
      return { success: false, message: 'Invalid avatarId' }
    }

    if (loadedJson.type === 'avatar' || loadedJson?.configs) loadedType = 'avatar'
    else if (loadedJson.type === 'config' || loadedJson?.valuedParams) loadedType = 'config'
    else {
      log.error('Malformed config')
      return { success: false, message: 'Malformed config' }
    }

    if (loadedType === 'avatar') {
      parsedContent =
        typeof loadedJson.configs === 'string' ? JSON.parse(loadedJson.configs) : loadedJson.configs
    } else {
      configParams =
        typeof loadedJson.valuedParams !== 'string' ? JSON.stringify(loadedJson.valuedParams) : '[]'
      loadedConfig = loadedJson
    }

    try {
      db.prepare(
        `INSERT INTO avatarStorage (avatarId, name)
         VALUES (?, ?)`
      ).run(loadedJson.avatarId, loadedJson.name)
    } catch {
      log.warn('Avatar already exists, skipping')
    }

    if (loadedType === 'avatar') {
      log.info('Type Avatar')
      for (const config of parsedContent) {
        if (!config?.uqid) {
          config.uqid = generateUniqueUqid(db)
          if (config.presets?.forUqid) config.presets.forUqid = config.uqid
        }

        const existingConfig = db
          .prepare(
            `
          SELECT id, name FROM avatars WHERE uqid = ? LIMIT 1
          `
          )
          .get(config.uqid) as { id: number; name: string } | undefined

        if (existingConfig?.id) {
          config.uqid = generateUniqueUqid(db)
          if (config.presets?.forUqid) config.presets.forUqid = config.uqid
        }

        if (existingConfig?.name === config.name) {
          const dup = getNextDuplicateNumber(db, config.name || 'Unknown')
          config.name = `${config.name} (${dup})`
        }

        if (config.parameters && typeof config.parameters !== 'string')
          config.parameters = JSON.stringify(config.parameters)

        insertConfig(db, config, loadedJson.name || 'Unknown', config.parameters || '[]', log)
        if (config.isPreset)
          insertPreset(db, config, loadedJson.avatarId, loadedJson.name || 'Unknown', log)
      }
    } else {
      if (!loadedConfig.uqid) {
        loadedConfig.uqid = generateUqid(randomString())
        if (loadedConfig.presets?.forUqid) loadedConfig.presets.forUqid = loadedConfig.uqid
      }

      const conflictResult = await handleConfigConflict(db, loadedConfig, mainWindow)

      if (!conflictResult.continue) {
        log.info('User cancelled upload due to conflict')
        return { success: false, message: 'Upload cancelled' }
      }

      loadedConfig = conflictResult.config

      insertConfig(db, loadedConfig, loadedConfig.avatarName || 'Unknown', configParams, log)
      if (loadedConfig.isPreset)
        insertPreset(
          db,
          loadedConfig,
          loadedJson.avatarId,
          loadedConfig.avatarName || 'Unknown',
          log
        )
    }

    log.info('Avatar upload process completed successfully')
    return { success: true, message: 'Saved' }
  } catch (e) {
    log.error('Saving Error: ', e)
    return { success: false, message: 'Database error' }
  }
}
