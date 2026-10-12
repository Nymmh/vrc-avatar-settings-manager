import { handleIpc } from '../ipc/handleIpc'
import path from 'path'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { electronApp, is } from '@electron-toolkit/utils'
import log from 'electron-log/main'
import { avatarDatabase } from './avatarDatabase'
import icon from '../../resources/icon.png?asset'
import { syncAllAvatarNames } from '../database/syncAllAvatarNames'
import { checkDataFolder } from '../file/checkDataFolder'
import { startOSC } from '../osc/startOSC'
import type { OSCConnection } from '../types/osc'
import { registerOSCStartupNotifications } from './oscStartupNotifications'
import { OSCHandler } from '../osc/oscHandler'
import { ASMStorage } from './ASMStorage'
import { ipcHandlers } from '../ipc/handlers/ipcHandler'
import { deleteOldLog } from '../file/deleteOldLog'
import { update } from './update'
import { VRChatMonitor } from './VRChatMonitor'
import { VRChatLogMonitor } from '../file/getVRChatLog'

let mainWindow: BrowserWindow | null = null
let oscConnection: OSCConnection | null = null
const oscStartup = new AbortController()
const reportOSCStartup = registerOSCStartupNotifications(ipcMain, () => mainWindow)
let oscSetup: Promise<boolean> | null = null
let shutdownStarted = false
let shutdownComplete = false
let asmStorage: ASMStorage | null = null
let vrchatMonitor: VRChatMonitor | null = null

const dataFolder = checkDataFolder()

log.initialize()
log.transports.file.resolvePathFn = () => path.join(dataFolder.folderPath, 'meow.log')
log.transports.file.fileName = 'meow.log'
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5 MB
log.transports.file.level = 'info'
deleteOldLog(log, dataFolder.folderPath)
log.info(`Meow Meow starting...`)
log.info(`Version: ${app.getVersion()}`)

const avatarDB = avatarDatabase(log)

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      spellcheck: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

async function setupOSC(): Promise<boolean> {
  const connection = await startOSC(log, reportOSCStartup, oscStartup.signal, async (client) => {
    if (!mainWindow || !asmStorage) throw new Error('App closed during OSC setup')
    const handler = new OSCHandler(log, mainWindow, avatarDB, client, asmStorage)
    const logMonitor = new VRChatLogMonitor(log, () => monitor.onNewLogFileFound())
    const monitor = new VRChatMonitor(
      log,
      mainWindow,
      asmStorage,
      logMonitor,
      handler,
      reportOSCStartup
    )
    vrchatMonitor = monitor
    const stop = (): void => {
      monitor.stop()
      handler.cleanup()
    }

    try {
      await monitor.start()
    } catch (error) {
      stop()
      throw error
    }

    return {
      handleMessage: (data) => {
        void monitor.handleOSCMessage(data).catch((error) => {
          log.error('Error handling OSC message:', error)
        })
      },
      stop
    }
  })

  if (!connection) return false
  if (oscStartup.signal.aborted || !mainWindow || !asmStorage) {
    await connection.stop()
    return false
  }

  oscConnection = connection
  asmStorage.setPendingState(false)
  return true
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.nymh.avatarsettingsmanager')
  asmStorage = new ASMStorage()
  ipcHandlers({
    log,
    avatarDB,
    storage: asmStorage,
    getMainWindow: () => mainWindow,
    getOSCClient: () => oscConnection?.client ?? null,
    dataFolder
  })
  handleIpc('skipVRChatCheck', (event) => {
    if (event.sender !== mainWindow?.webContents) return false
    return vrchatMonitor?.skipVRChatCheck() ?? false
  })
  createWindow()
  syncAllAvatarNames(log, avatarDB)
  oscSetup = setupOSC()
  if (!(await oscSetup) || oscStartup.signal.aborted) return
  update(log, avatarDB)

  log.info('App is ready')
})

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('will-quit', async (event) => {
  if (shutdownComplete) return
  event.preventDefault()
  if (shutdownStarted) return
  shutdownStarted = true

  log.info('Meow Meow is shutting down...')
  try {
    await oscSetup
    await oscConnection?.stop()
    asmStorage?.cleanState()
    avatarDB.close()
    log.info('Everything cleaned up!')
  } catch (error) {
    log.error('Shutdown failed:', error)
  } finally {
    shutdownComplete = true
    log.info('---------------------------------------')
    app.quit()
  }
})

app.on('before-quit', () => {
  oscStartup.abort()
  ipcMain.removeAllListeners()
  mainWindow = null
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('uncaughtException', (e) => {
  log.error('Uncaught Exception:', e)
})

process.on('unhandledRejection', (e) => {
  log.error('Unhandled Promise Rejection:', e)
})
