import { ipcMain, BrowserWindow, dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { ASMStorage } from '../../main/ASMStorage'
import { exportConfig } from '../../file/exportConfig'
import { exportAllConfigs } from '../../file/exportAllConfigs'
import { importAllConfigs } from '../../file/importAllConfigs'
import { getNames } from '../../database/getSavedNames'

interface ExportHandlerContext {
  log: Logger
  avatarDB: Database
  storage: ASMStorage
  getMainWindow: () => BrowserWindow | null
}

export function exportHandlers(context: ExportHandlerContext): void {
  const { log, avatarDB, storage, getMainWindow } = context

  ipcMain.handle('exportConfig', async (_event, id: number) => {
    log.info('Export config...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    return await exportConfig(log, avatarDB, dialog, mainWindow, id)
  })

  ipcMain.handle('exportAllConfigs', async () => {
    log.info('Export all configs...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    return await exportAllConfigs(log, avatarDB, mainWindow, dialog)
  })

  ipcMain.handle('importAllConfigs', async () => {
    log.info('Import all configs...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    const res = await importAllConfigs(log, avatarDB, mainWindow, dialog)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    log.info('Import all configs completed')
    return res
  })
}
