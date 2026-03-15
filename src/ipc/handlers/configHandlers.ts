import { ipcMain, BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { ASMStorage } from '../../main/ASMStorage'
import { saveConfig } from '../saveConfig'
import { loadConfig } from '../loadConfig'
import { uploadConfig } from '../uploadConfig'
import { uploadConfigAndApply } from '../uploadConfigAndApply'
import { applyFromSaved } from '../applyFromSaved'
import { avatarConfig } from '../../services/avatarConfig'
import { getNames } from '../../database/getSavedNames'
import { getLoadDataName } from '../../helpers/getLoadDataName'
import { getAllSaved } from '../../database/getAllSaved'
import { updateSavedConfig } from '../../database/updateSavedConfig'
import { updateSavedConfigData } from '../../database/updateSavedData'
import { replaceParams } from '../../database/replaceParams'
import { deleteConfig } from '../../database/deleteConfig'
import { showDialogNoSound } from '../../services/showDialogNoSound'
import { applyConfigCode } from '../../file/applyConfigCode'

interface ConfigHandlerContext {
  log: Logger
  avatarDB: Database
  storage: ASMStorage
  getMainWindow: () => BrowserWindow | null
  getOSCClient: () => Client | null
}

export function configHandlers(context: ConfigHandlerContext): void {
  const { log, avatarDB, storage, getMainWindow, getOSCClient } = context

  ipcMain.handle('saveConfig', async (_event, { content, saveName, nsfw }) => {
    log.info('Save config...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    const currentAviId = storage.getCurrentAvatarId()
    const pendingChanges = storage.getPendingChanges()

    content = await avatarConfig(avatarDB, currentAviId, mainWindow, pendingChanges, log)

    if (!content) {
      log.info('Failed to get avatar config')
      return { success: false, message: 'Failed to get avatar config' }
    }

    const savedConfig = await saveConfig(log, avatarDB, content, saveName, nsfw, false, mainWindow)
    getNames(log, avatarDB, mainWindow, currentAviId)
    return savedConfig
  })

  ipcMain.handle('loadConfig', async () => {
    log.info('Loading config...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return
    }

    const dataParsedConfig = await loadConfig(log, mainWindow)

    if (!dataParsedConfig) {
      log.warn('No file data')
      return { name: '', match: false, error: 'No file data' }
    }

    if (typeof dataParsedConfig === 'string' || dataParsedConfig.toString().startsWith('ASM:')) {
      const res = await applyConfigCode(
        log,
        avatarDB,
        mainWindow,
        storage.getCurrentAvatarId() || '',
        getOSCClient()!,
        dataParsedConfig.toString()
      )

      if (res && 'success' in res && res.success) {
        return { error: '' }
      } else {
        return { error: 'Failed to apply share code' }
      }
    }
    if (!dataParsedConfig.avatarId) {
      log.warn('Loaded config is missing ID')
      return { name: '', match: false, error: 'Loaded config is missing ID' }
    }

    if (!dataParsedConfig.name) {
      log.warn('Loaded config is missing name')
      return { name: '', match: false, error: 'Loaded config is missing name' }
    }

    const avatarName: string = await getLoadDataName(dataParsedConfig)

    storage.setLoadedJson(dataParsedConfig)
    const currentAviId = storage.getCurrentAvatarId()

    log.info('Config loaded successfully')
    return { name: avatarName, match: dataParsedConfig.avatarId === currentAviId, error: '' }
  })

  ipcMain.handle('applyConfig', async (_event, id: number) => {
    log.info(`Applying config...`)

    const mainWindow = getMainWindow()
    const oscClient = getOSCClient()
    if (!mainWindow || !oscClient) {
      log.error('Required dependencies not found')
      return { success: false }
    }

    const currentAviId = storage.getCurrentAvatarId()
    if (!currentAviId) {
      log.error('No avatar currently loaded')
      return { success: false }
    }

    const res = await applyFromSaved(
      log,
      avatarDB,
      id,
      currentAviId,
      oscClient,
      mainWindow,
      storage
    )
    log.info(`Config applied`)
    return { success: !!res }
  })

  ipcMain.handle(
    'uploadConfigAndApply',
    async (_event, saveName: string | '', saveOption: boolean, avatarName: string | 'Unknown') => {
      log.info('Uploading config and applying...')

      const mainWindow = getMainWindow()
      const oscClient = getOSCClient()
      if (!mainWindow || !oscClient) {
        log.error('Required dependencies not found')
        return { success: false }
      }

      const loadedJson = storage.getLoadedJson()
      const currentAviId = storage.getCurrentAvatarId()

      if (!loadedJson) {
        log.info('No configuration loaded to upload')
        return { success: false }
      }

      const uploadingResult = await uploadConfigAndApply(
        log,
        avatarDB,
        loadedJson,
        oscClient,
        saveName,
        saveOption,
        currentAviId,
        avatarName,
        mainWindow
      )
      getNames(log, avatarDB, mainWindow, currentAviId)

      log.info('Upload and apply process completed')
      return uploadingResult
    }
  )

  ipcMain.handle(
    'uploadConfig',
    async (_event, saveName: string | '', nsfw: boolean, avatarId: string | '') => {
      log.info('Uploading configuration...')
      const mainWindow = getMainWindow()
      if (!mainWindow) {
        log.error('Dependency not found')
        return { success: false }
      }

      const loadedJson = storage.getLoadedJson()
      if (!loadedJson) {
        log.info('No configuration loaded to upload')
        return { success: false }
      }

      const currentAviId = storage.getCurrentAvatarId()

      const res = await uploadConfig(
        log,
        avatarDB,
        saveName,
        nsfw,
        avatarId,
        loadedJson,
        mainWindow
      )
      getNames(log, avatarDB, mainWindow, currentAviId)

      log.info('Upload process completed')
      return res
    }
  )

  ipcMain.handle('refreshAvatarFile', async () => {
    log.info('Refreshing avatar config...')
    const mainWindow = getMainWindow()

    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false, avatarId: '' }
    }

    const currentAviId = storage.getCurrentAvatarId()
    storage.clearLoadedJson()

    await avatarConfig(avatarDB, currentAviId, mainWindow, new Map(), log)
    getNames(log, avatarDB, mainWindow, currentAviId)
    log.info('Avatar config refreshed')
    return { success: true, avatarId: currentAviId }
  })

  ipcMain.handle('getAllSaved', async () => {
    return await getAllSaved(log, avatarDB)
  })

  ipcMain.handle('getConfigByUqid', async (_event, uqid: string) => {
    return await getAllSaved(log, avatarDB, uqid)
  })

  ipcMain.handle('updateConfig', async (_event, id, avatarId, avatarName, saveName) => {
    log.info('Update config...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    const userResponse = await showDialogNoSound(
      ['Yes', 'No'],
      0,
      'Overwrite Warning',
      'Are you sure you want to overwrite the saved config?',
      mainWindow
    )

    if (userResponse.response !== 0) {
      log.info('Update cancelled by user')
      return {
        success: false,
        message: 'Update cancelled by user'
      }
    }

    const pendingChanges = storage.getPendingChanges()
    const currentAviId = storage.getCurrentAvatarId()

    const res = await updateSavedConfig(
      log,
      avatarDB,
      id,
      avatarId,
      avatarName,
      saveName,
      mainWindow,
      pendingChanges
    )

    getNames(log, avatarDB, mainWindow, currentAviId)

    log.info('Config update process completed')
    return res
  })

  ipcMain.handle('updateConfigData', async (_event, id, avatarId, saveName, nsfw) => {
    log.info('Updating config data...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    const res = await updateSavedConfigData(log, avatarDB, mainWindow, id, avatarId, saveName, nsfw)
    const currentAviId = storage.getCurrentAvatarId()

    getNames(log, avatarDB, mainWindow, currentAviId)

    log.info('Update config data process completed')
    return res
  })

  ipcMain.handle('replaceParams', async (_event, id: number) => {
    log.info('Replacing parameters...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false, message: 'Internal Error' }
    }

    return await replaceParams(log, avatarDB, mainWindow, id)
  })

  ipcMain.handle('deleteConfig', async (_event, id: number) => {
    log.info('Delete config...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false, message: 'Internal Error' }
    }

    const del = await deleteConfig(log, avatarDB, mainWindow, id)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    log.info('Delete config process completed')
    return del
  })

  ipcMain.handle('getConfigById', async (_event, avatarId: string) => {
    log.info('Get config by Id....')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return null
    }

    const q = avatarDB.prepare('SELECT * FROM avatars WHERE avatarId = ?')
    const config = q.all(avatarId)

    log.info('Fetch config process completed')
    return config || null
  })
}
