import { isVRChatRunning } from '../../helpers/isVRChatRunning'
import { handleIpc } from '../handleIpc'
import { app, BrowserWindow, shell } from 'electron'
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
  handleIpc('isVRChatRunning', () => isVRChatRunning())
  handleIpc('appVersion', () => {
    context.log.info('Fetching app version...')
    return app.getVersion()
  })

  handleIpc('getLogFileSize', async () => {
    context.log.info('Fetching log file size...')
    const logFilePath = path.join(dataFolder.folderPath, 'meow.log')

    try {
      const stats = await fs.promises.stat(logFilePath)
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
      return `${fileSizeInMB} MB`
    } catch (e) {
      context.log.error('Error fetching log file size', e)
      return '0 MB'
    }
  })

  handleIpc('openLogFile', async () => {
    try {
      context.log.info('Opening log file location...')
      const logDir = path.join(dataFolder.folderPath)
      const error = await shell.openPath(logDir)
      if (error) throw new Error(error)
    } catch (e) {
      context.log.error('Error opening log file location', e)
      throw e
    }
  })

  handleIpc('openExportDirectory', async () => {
    try {
      context.log.info('Opening export directory...')
      const exportPath = path.join(dataFolder.folderPath, 'exports')
      fs.mkdirSync(exportPath, { recursive: true })
      const err = await shell.openPath(exportPath)
      if (err) throw new Error(err)
    } catch (e) {
      context.log.error('Error opening export directory', e)
      throw e
    }
  })

  handleIpc('deleteLogFile', async () => {
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

  handleIpc('getSaveFaceTrackingSetting', async () =>
    getSaveFaceTrackingSetting(avatarDB, context.log)
  )

  handleIpc('setSaveFaceTrackingSetting', async (_, value) =>
    setSaveFaceTrackingSetting(avatarDB, value, context.log)
  )

  handleIpc('getCopyForDiscordSetting', async () => getCopyForDiscordSetting(avatarDB, context.log))

  handleIpc('setCopyForDiscordSetting', async (_, value) =>
    setCopyForDiscordSetting(avatarDB, value, context.log)
  )

  handleIpc('getApplyConfigBufferSetting', async () =>
    getApplyConfigBufferSetting(avatarDB, context.log)
  )

  handleIpc('setApplyConfigBufferSetting', async (_, value) =>
    setApplyConfigBufferSetting(avatarDB, value, context.log)
  )

  handleIpc('getLowPerformanceModeSetting', async () =>
    getLowPerformanceModeSetting(avatarDB, context.log)
  )

  handleIpc('setLowPerformanceModeSetting', async (_, value) => {
    return await setLowPerformanceModeSetting(avatarDB, value, context.log)
  })

  handleIpc('deleteDatabase', async () => {
    if (!getMainWindow()) {
      context.log.error('Dependency not found')
      return false
    }

    return deleteDatabase(context.log, avatarDB, getMainWindow()!)
  })

  handleIpc('getExportedFileCount', async () => await getExportedFileCount(context.log, dataFolder))
}
