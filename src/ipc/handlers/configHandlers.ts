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
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false }

    const currentAviId = storage.getCurrentAvatarId()
    const pendingChanges = storage.getPendingChanges()

    content = await avatarConfig(currentAviId, mainWindow, pendingChanges)

    const savedConfig = await saveConfig(log, avatarDB, content, saveName, nsfw, false, mainWindow)
    getNames(log, avatarDB, mainWindow, currentAviId)
    return savedConfig
  })

  ipcMain.handle('loadConfig', async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    const dataParsedConfig = await loadConfig(log, mainWindow)

    if (!dataParsedConfig) {
      log.error('No file data')
      return { name: '', match: false, error: 'No file data' }
    }

    if (!dataParsedConfig.avatarId) {
      return { name: '', match: false, error: 'Loaded config is missing ID' }
    }

    if (!dataParsedConfig.name) {
      return { name: '', match: false, error: 'Loaded config is missing name' }
    }

    const avatarName: string = await getLoadDataName(dataParsedConfig)

    storage.setLoadedJson(dataParsedConfig)
    const currentAviId = storage.getCurrentAvatarId()

    return { name: avatarName, match: dataParsedConfig.avatarId === currentAviId, error: '' }
  })

  ipcMain.handle('applyConfig', async (_event, id: number) => {
    const mainWindow = getMainWindow()
    const oscClient = getOSCClient()
    if (!mainWindow || !oscClient) return { success: false }

    const currentAviId = storage.getCurrentAvatarId()
    if (!currentAviId) return { success: false }

    const res = await applyFromSaved(log, avatarDB, id, currentAviId, oscClient, mainWindow)
    return { success: !!res }
  })

  ipcMain.handle(
    'uploadConfigAndApply',
    async (_event, saveName: string | '', saveOption: boolean, avatarName: string | 'Unknown') => {
      const mainWindow = getMainWindow()
      const oscClient = getOSCClient()
      if (!mainWindow || !oscClient) return { success: false }

      const loadedJson = storage.getLoadedJson()
      const currentAviId = storage.getCurrentAvatarId()

      if (!loadedJson) {
        log.error('No configuration loaded to upload')
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
      return uploadingResult
    }
  )

  ipcMain.handle(
    'uploadConfig',
    async (_event, saveName: string | '', nsfw: boolean, avatarId: string | '') => {
      const mainWindow = getMainWindow()
      if (!mainWindow) return { success: false }

      const loadedJson = storage.getLoadedJson()
      if (!loadedJson) {
        log.error('No configuration loaded to upload')
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
      return res
    }
  )

  ipcMain.handle('refreshAvatarFile', async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false }

    const currentAviId = storage.getCurrentAvatarId()
    storage.setLoadedJson(null)

    avatarConfig(currentAviId, mainWindow, new Map())
    getNames(log, avatarDB, mainWindow, currentAviId)
    return { success: true }
  })

  ipcMain.handle('getAllSaved', async () => {
    return await getAllSaved(log, avatarDB)
  })

  ipcMain.handle('getSavedByUqid', async (_event, uqid: string) => {
    return await getAllSaved(log, avatarDB, uqid)
  })

  ipcMain.handle('updateConfig', async (_event, id, avatarId, avatarName, saveName) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false }

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
    return res
  })

  ipcMain.handle('updateConfigData', async (_event, id, avatarId, saveName, nsfw) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false }

    const res = await updateSavedConfigData(log, avatarDB, id, avatarId, saveName, nsfw)
    const currentAviId = storage.getCurrentAvatarId()

    getNames(log, avatarDB, mainWindow, currentAviId)
    return res
  })

  ipcMain.handle('replaceParams', async (_event, id: number) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false, message: 'Internal Error' }

    return await replaceParams(log, avatarDB, mainWindow, id)
  })

  ipcMain.handle('deleteConfig', async (_event, id: number) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false, message: 'Internal Error' }

    const del = await deleteConfig(log, avatarDB, mainWindow, id)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    return del
  })
}
