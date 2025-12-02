import { ipcMain, BrowserWindow, dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { ASMStorage } from '../../main/ASMStorage'
import { loadAvatarConfig } from '../loadAvatarConfig'
import { uploadAvatarConfig } from '../../database/uploadAvatarConfig'
import { getAvatars } from '../../database/getAvatars'
import { deleteAvatar } from '../../database/deleteAvatar'
import { updateAvatarData } from '../../database/updateAvatarData'
import { exportAvatar } from '../../file/exportAvatar'
import { getNames } from '../../database/getSavedNames'

interface AvatarHandlerContext {
  log: Logger
  avatarDB: Database
  storage: ASMStorage
  getMainWindow: () => BrowserWindow | null
}

export function avatarHandlers(context: AvatarHandlerContext): void {
  const { log, avatarDB, storage, getMainWindow } = context

  ipcMain.handle('loadAvatarConfig', async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    const loadedAvatarJson = await loadAvatarConfig(log, mainWindow)
    storage.setLoadedAvatarJson(loadedAvatarJson)
    return loadedAvatarJson
  })

  ipcMain.handle('uploadAvatarConfig', async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { upload: false }

    const loadedAvatarJson = storage.getLoadedAvatarJson()
    if (!loadedAvatarJson) return { upload: false }

    const res = await uploadAvatarConfig(log, avatarDB, loadedAvatarJson, mainWindow)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    return res
  })

  ipcMain.handle('getAllAvatars', async () => {
    return await getAvatars(log, avatarDB)
  })

  ipcMain.handle('deleteAvatar', async (_event, avatarId: string) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false }

    const del = await deleteAvatar(log, avatarDB, mainWindow, avatarId)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    return del
  })

  ipcMain.handle('exportAvatar', async (_event, avatarId: string) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false }

    return await exportAvatar(log, avatarDB, dialog, mainWindow, avatarId)
  })

  ipcMain.handle('updateAvatarData', async (_event, avatarId: string, name: string) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false }

    const res = await updateAvatarData(log, avatarDB, avatarId, name)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    return res
  })
}
