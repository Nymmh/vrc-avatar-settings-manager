import path from 'path'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { Client, Server } from 'node-osc'
import log from 'electron-log/main'
import { avatarDatabase } from './avatarDatabase'
import icon from '../../resources/icon.png?asset'
import { syncAllAvatarNames } from '../database/syncAllAvatarNames'
import { checkDataFolder } from '../file/checkDataFolder'
import { oscClient } from '../osc/oscClient'
import { oscServer } from '../osc/oscServer'
import { oscQuery } from '../osc/oscQuery'
import { OSCHandler } from '../osc/oscHandler'
import { ASMStorage } from './ASMStorage'
import { ipcHandlers } from '../ipc/handlers/ipcHandler'
import { deleteOldLog } from '../file/deleteOldLog'

let mainWindow: BrowserWindow | null = null
let OSC_CLIENT: Client | null = null
let OSC_SERVER: Server | null = null
let oscHandler: OSCHandler | null = null
let asmStorage: ASMStorage | null = null

const dataFolder = checkDataFolder()

log.initialize()
log.transports.file.resolvePathFn = () => path.join(dataFolder.folderPath, 'meow.log')
log.transports.file.fileName = 'meow.log'
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5 MB
log.transports.file.level = 'info'
deleteOldLog(log, dataFolder.folderPath)
log.info('Meow Meow starting...')

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
      contextIsolation: true
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

async function setupOSC(): Promise<void> {
  log.info('Setting up OSC...')

  try {
    const PORT = await oscQuery(log)
    OSC_SERVER = await oscServer(log, PORT)
    OSC_CLIENT = await oscClient(log)

    if (!mainWindow || !asmStorage || !OSC_CLIENT) {
      log.info('Required dependencies not initialized')
      throw new Error('Required dependencies not initialized')
    }

    asmStorage.setPendingState(false)
    oscHandler = new OSCHandler(log, mainWindow, avatarDB, OSC_CLIENT, asmStorage)
    OSC_SERVER.on('message', (data) => oscHandler!.handleMessage(data))

    log.info('OSC setup complete')
  } catch (e) {
    log.info('Error setting up OSC: ', e)
    app.quit()
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.nymh.avatarsettingsmanager')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  asmStorage = new ASMStorage()

  ipcHandlers({
    log,
    avatarDB,
    storage: asmStorage,
    getMainWindow: () => mainWindow,
    getOSCClient: () => OSC_CLIENT,
    dataFolder
  })

  createWindow()
  syncAllAvatarNames(log, avatarDB)
  await setupOSC()
  // update(log)
  log.info('App is ready')
})

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('will-quit', () => {
  log.info('Meow Meow is shutting down...')
  log.info('---------------------------------------')
  asmStorage?.cleanState()
  avatarDB.close()
  OSC_CLIENT.close(OSC_CLIENT)
  OSC_SERVER.close(OSC_SERVER)
})

app.on('before-quit', () => {
  ipcMain.removeAllListeners()
  mainWindow = null
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('uncaughtException', (e) => {
  log.info('Uncaught Exception:', e)
})

process.on('unhandledRejection', (e) => {
  log.info('Unhandled Promise Rejection:', e)
})
