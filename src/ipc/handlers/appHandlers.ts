import { ipcMain, app, BrowserWindow, shell } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { ASMStorage } from '../../main/ASMStorage'
import { Client } from 'node-osc'
import fs from 'fs'
import path from 'path'
import { showDialogNoSound } from '../../services/showDialogNoSound'
import { getSaveFaceTrackingSetting } from '../../database/getSaveFaceTrackingSetting'
import { setSaveFaceTrackingSetting } from '../../database/setSaveFaceTrackingSetting'

interface DataFolder {
  folderPath: string
  avatarConfigData: string
  avatarData: string
  fullExport: string
}

interface appHandlersContext {
  log: Logger
  avatarDB: Database
  storage: ASMStorage
  getMainWindow: () => BrowserWindow | null
  getOSCClient: () => Client | null
  dataFolder: DataFolder
}

export function appHandlers(context: appHandlersContext): void {
  const { avatarDB, getMainWindow, dataFolder } = context
  ipcMain.handle('appVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('getLogFileSize', async () => {
    const logFilePath = path.join(dataFolder.folderPath, 'meow.log')

    try {
      const stats = await fs.promises.stat(logFilePath)
      const fileSizeInBytes = stats.size
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2)
      return `${fileSizeInMB} MB`
    } catch {
      return '0 MB'
    }
  })

  ipcMain.handle('openLogFile', () => {
    const logFilePath = path.join(dataFolder.folderPath)
    shell.openPath(logFilePath)
  })

  ipcMain.handle('deleteLogFile', async () => {
    const logFilePath = path.join(dataFolder.folderPath, 'meow.log')

    try {
      const userResponse = await showDialogNoSound(
        ['Yes', 'No'],
        0,
        'Delete Log File',
        `Are you sure you want to delete the log file? This action cannot be undone.`,
        getMainWindow()!
      )

      if (userResponse.response !== 0) return false

      await fs.promises.unlink(logFilePath)
      await fs.promises.writeFile(logFilePath, '', 'utf-8')
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('getSaveFaceTrackingSetting', async () => {
    return getSaveFaceTrackingSetting(avatarDB)
  })

  ipcMain.handle('setSaveFaceTrackingSetting', async (_, value: boolean) => {
    return setSaveFaceTrackingSetting(avatarDB, value)
  })
}
