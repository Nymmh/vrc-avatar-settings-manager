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
import { getCopyForDiscordSetting } from '../../database/getCopyForDiscordSetting'
import { setCopyForDiscordSetting } from '../../database/setCopyForDiscordSetting'
import { getApplyConfigBufferSetting } from '../../database/getApplyConfigBufferSetting'
import { setApplyConfigBufferSetting } from '../../database/setApplyConfigBufferSetting'
import { deleteDatabase } from '../../database/deleteDatabase'
import { getExportedFileCount } from '../../file/getExportedFileCount'
import { getLowPerformanceModeSetting } from '../../database/getLowPerformanceModeSetting'
import { setLowPerformanceModeSetting } from '../../database/setLowPerformanceModeSetting'

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
    context.log.info('Fetching app version...')
    return app.getVersion()
  })

  ipcMain.handle('getLogFileSize', async () => {
    context.log.info('Fetching log file size...')
    const logFilePath = path.join(dataFolder.folderPath, 'meow.log')

    try {
      const stats = await fs.promises.stat(logFilePath)
      const fileSizeInBytes = stats.size
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2)
      return `${fileSizeInMB} MB`
    } catch (e) {
      context.log.error('Error fetching log file size', e)
      return '0 MB'
    }
  })

  ipcMain.handle('openLogFile', () => {
    try {
      context.log.info('Opening log file location...')
      const logFilePath = path.join(dataFolder.folderPath)
      shell.openPath(logFilePath)
    } catch (e) {
      context.log.error('Error opening log file location', e)
    }
  })

  ipcMain.handle('openExportDirectory', () => {
    try {
      context.log.info('Opening export directory...')
      const exportPath = path.join(dataFolder.folderPath, 'exports')
      fs.mkdirSync(exportPath, { recursive: true })
      shell.openPath(exportPath)
    } catch (e) {
      context.log.error('Error opening export directory', e)
    }
  })

  ipcMain.handle('deleteLogFile', async () => {
    context.log.info('Delete log file...')
    const logFilePath = path.join(dataFolder.folderPath, 'meow.log')

    try {
      const userResponse = await showDialogNoSound(
        ['Yes', 'No'],
        0,
        'Delete Log File',
        `Are you sure you want to delete the log file? This action cannot be undone.`,
        getMainWindow()!
      )

      if (userResponse.response !== 0) {
        context.log.info('User cancelled log file deletion')
        return false
      }

      await fs.promises.unlink(logFilePath)
      await fs.promises.writeFile(logFilePath, '', 'utf-8')
      context.log.info('Log file deleted successfully')
      return true
    } catch (e) {
      context.log.error('Error deleting log file', e)
      return false
    }
  })

  ipcMain.handle('getSaveFaceTrackingSetting', async () => {
    return getSaveFaceTrackingSetting(avatarDB, context.log)
  })

  ipcMain.handle('setSaveFaceTrackingSetting', async (_, value: boolean) => {
    return setSaveFaceTrackingSetting(avatarDB, value, context.log)
  })

  ipcMain.handle('getCopyForDiscordSetting', async () => {
    return getCopyForDiscordSetting(avatarDB, context.log)
  })

  ipcMain.handle('setCopyForDiscordSetting', async (_, value: boolean) => {
    return setCopyForDiscordSetting(avatarDB, value, context.log)
  })

  ipcMain.handle('getApplyConfigBufferSetting', async () => {
    return getApplyConfigBufferSetting(avatarDB, context.log)
  })

  ipcMain.handle('setApplyConfigBufferSetting', async (_, value: boolean) => {
    return setApplyConfigBufferSetting(avatarDB, value, context.log)
  })

  ipcMain.handle('getLowPerformanceModeSetting', async () => {
    return getLowPerformanceModeSetting(avatarDB, context.log)
  })

  ipcMain.handle('setLowPerformanceModeSetting', async (_, value: boolean) => {
    const lowPerformanceModeSetting = await setLowPerformanceModeSetting(
      avatarDB,
      value,
      context.log
    )
    return lowPerformanceModeSetting
  })

  ipcMain.handle('deleteDatabase', async () => {
    if (!getMainWindow()) {
      context.log.error('Dependency not found')
      return false
    }

    return deleteDatabase(context.log, avatarDB, getMainWindow()!)
  })

  ipcMain.handle('getExportedFileCount', async () => {
    return await getExportedFileCount(context.log, dataFolder)
  })
}
