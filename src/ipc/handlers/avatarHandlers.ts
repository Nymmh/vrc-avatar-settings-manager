import { handleIpc } from '../handleIpc'
import { BrowserWindow, dialog, clipboard } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { ASMStorage } from '../../main/ASMStorage'
import { loadAvatarConfig } from '../loadAvatarConfig'
import { uploadAvatarConfig } from '../../database/uploadAvatarConfig'
import { getAvatars } from '../../database/getAvatars'
import { deleteAvatar } from '../../database/deleteAvatar'
import { updateAvatarData } from '../../database/updateAvatarData'
import { exportAvatar } from '../../file/exportAvatar'
import { getNames } from '../../database/getSavedNames'
import { applyConfigCode } from '../../file/applyConfigCode'
import { generateRandomParams } from '../../helpers/generateRandomParams'

interface AvatarHandlerContext {
  log: Logger
  avatarDB: Database
  storage: ASMStorage
  getMainWindow: () => BrowserWindow | null
  getOSCClient: () => Client | null
}

export function avatarHandlers(context: AvatarHandlerContext): void {
  const { log, avatarDB, storage, getMainWindow, getOSCClient } = context

  handleIpc('loadAvatarConfig', async () => {
    log.info('Load avatar config...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return
    }

    const OSCClient = getOSCClient()
    if (!OSCClient) {
      log.error('Dependency not found')
      return
    }

    const loadedAvatarJson = await loadAvatarConfig(log, mainWindow)

    if (typeof loadedAvatarJson === 'string') {
      const convertedConfig = await applyConfigCode(
        log,
        avatarDB,
        mainWindow,
        '',
        OSCClient,
        loadedAvatarJson,
        true
      )

      if ('success' in convertedConfig) {
        storage.setLoadedAvatarJson(null)
        return convertedConfig
      }

      storage.setLoadedAvatarJson(convertedConfig)
      return convertedConfig
    }

    storage.setLoadedAvatarJson(loadedAvatarJson)
    log.info(`Config version: ${loadedAvatarJson?.version || 'unknown'}`)
    log.info('Avatar config loaded')
    return loadedAvatarJson
  })

  handleIpc('uploadAvatarConfig', async () => {
    log.info('Upload avatar config...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { upload: false, success: false }
    }

    const loadedAvatarJson = storage.getLoadedAvatarJson()
    if (!loadedAvatarJson) {
      log.error('No avatar config loaded')
      return { upload: false, success: false }
    }

    const res = await uploadAvatarConfig(log, avatarDB, loadedAvatarJson, mainWindow)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    log.info('Upload avatar config completed')
    return res
  })

  handleIpc('getAllAvatars', async () => await getAvatars(log, avatarDB))

  handleIpc('deleteAvatar', async (_event, avatarId) => {
    log.info('Delete avatar...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    const del = await deleteAvatar(log, avatarDB, mainWindow, avatarId)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    log.info('Delete avatar process completed')
    return del
  })

  handleIpc('exportAvatar', async (_event, avatarId) => {
    log.info('Export avatar...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    return await exportAvatar(log, avatarDB, dialog, mainWindow, avatarId)
  })

  handleIpc('updateAvatarData', async (_event, avatarId, name, updateId) => {
    log.info('Update avatar data...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    const res = await updateAvatarData(log, avatarDB, mainWindow, avatarId, name, updateId)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    log.info('Update avatar data completed')
    return res
  })

  handleIpc('copyAvatarId', async () => {
    context.log.info('Copying avatar ID to clipboard...')
    const mainWindow = getMainWindow()
    const currentAviId = storage.getCurrentAvatarId()

    if (!mainWindow || !currentAviId) {
      context.log.error('Dependency not found')
      return { success: false }
    }

    clipboard.writeText(currentAviId)
    context.log.info('Avatar ID copied to clipboard')
    return { success: true }
  })

  handleIpc('randomParams', async () => {
    context.log.info('Generating random parameters for current avatar...')
    const mainWindow = getMainWindow()
    const avatarId = storage.getCurrentAvatarId()
    const OSCClient = getOSCClient()

    if (!mainWindow || !avatarId || !OSCClient) {
      context.log.error('Dependency not found')
      return { success: false }
    }

    return await generateRandomParams(context.log, mainWindow, avatarId, OSCClient, storage)
  })
}
