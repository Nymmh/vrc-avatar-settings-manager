import { ipcMain, BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { ASMStorage } from '../../main/ASMStorage'
import { getAllPresets } from '../../database/getAllPresets'
import { applyPreset } from '../../database/applyPreset'
import { updatePresetData } from '../../database/updatePresetData'
import { deletePreset } from '../../database/deletePreset'
import { createPresetFromApp } from '../../database/createPresetFromApp'
import { getNames } from '../../database/getSavedNames'

interface PresetHandlerContext {
  log: Logger
  avatarDB: Database
  storage: ASMStorage
  getMainWindow: () => BrowserWindow | null
  getOSCClient: () => Client | null
}

export function presetHandlers(context: PresetHandlerContext): void {
  const { log, avatarDB, storage, getMainWindow, getOSCClient } = context

  ipcMain.handle('getAllPresets', async () => {
    log.info('Get all presets...')
    return await getAllPresets(log, avatarDB)
  })

  ipcMain.handle('getPresetsByUqid', async (_event, uqid: string) => {
    log.info('Get all presets by uqid...')
    return await getAllPresets(log, avatarDB, uqid)
  })

  ipcMain.handle('applyPresetFromApp', async (_event, avatarId: string, unityParameter: number) => {
    log.info('Apply preset from app...')
    const mainWindow = getMainWindow()
    const oscClient = getOSCClient()
    if (!mainWindow || !oscClient) {
      log.error('Required dependencies not found')
      return { success: false }
    }

    return await applyPreset(log, mainWindow, avatarDB, avatarId, unityParameter, oscClient, true)
  })

  ipcMain.handle(
    'updatePresetFromApp',
    async (_event, id: number, saveName: string, parameter: number) => {
      log.info('Update preset from app...')
      const mainWindow = getMainWindow()
      if (!mainWindow) {
        log.error('Dependency not found')
        return { success: false }
      }

      return await updatePresetData(log, avatarDB, mainWindow, id, saveName, parameter)
    }
  )

  ipcMain.handle('deletePresetFromApp', async (_event, id: number) => {
    log.info('Delete preset from app...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    const del = await deletePreset(log, mainWindow, avatarDB, id)
    const currentAviId = storage.getCurrentAvatarId()
    getNames(log, avatarDB, mainWindow, currentAviId)
    log.info('Deleted preset from app, process finished')
    return del
  })

  ipcMain.handle('createPresetFromApp', async (_event, id: number) => {
    log.info('Create preset from app...')
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      log.error('Dependency not found')
      return { success: false }
    }

    return await createPresetFromApp(log, avatarDB, id)
  })
}
