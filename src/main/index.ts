import path from 'path'
import { Client } from 'node-osc'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import log from 'electron-log/main'
import { update } from './update'
import { oscClient } from '../services/oscClient'
import { oscServer } from '../services/oscServer'
import { oscListener } from '../services/oscListener'
import { oscQuery } from '../services/oscQuery'
import { avatarConfigType } from '../types/avatarConfigType'
import { getLoadDataName } from '../services/getLoadDataName'
import { saveConfig } from '../ipc/saveConfig'
import { loadConfig } from '../ipc/loadConfig'
import { uploadConfigIPC } from '../ipc/uploadConfig'
import icon from '../../resources/icon.png?asset'
import { avatarConfig } from '../services/avatarConfig'

let mainWindow: BrowserWindow | null = null
let loadedJson: avatarConfigType | null = null
let currentAviId: string = ''
const pendingChanges: Map<string, any> = new Map()
let OSC_CLIENT: Client
log.initialize()
log.transports.file.fileName = 'meow.log'
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}] [{level}] {text}'
log.transports.file.level = 'info'

log.info('Meow Meow starting...')

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
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
    const OSC_SERVER = await oscServer(log, PORT)
    OSC_CLIENT = await oscClient(log)

    if (!mainWindow) {
      log.error('Main window is not initialized')
      throw new Error('Main window is not initialized')
    }

    if (!OSC_SERVER) {
      log.error('OSC Server is not started')
      throw new Error('OSC Server is not started')
    }

    log.info('OSC Listener ready')
    // oscListener(log, OSC_SERVER, mainWindow)
    OSC_SERVER.on('message', (data) => {
      if (!data || data.length === 0) {
        log.warn('Received malformed OSC message:', data)
        return
      }

      let [address, payload] = data

      if (/VF\d+_(Sync|TC_current|Customization)/.test(address)) {
        return
      }

      if (address === '/avatar/change') {
        if (!mainWindow) {
          log.error('Main window is not initialized')
          throw new Error('Main window is not initialized')
        }
        log.log('Received avatar change with ID: ', payload)

        pendingChanges.clear()
        mainWindow.webContents.send('avatarId', { id: payload })
        currentAviId = payload
        avatarConfig(payload, mainWindow, new Map())
      } else if (address.includes('/avatar/parameters/')) {
        address = address.replace('/avatar/parameters/', '')
        pendingChanges.set(address, payload)
      }
    })
  } catch (e) {
    log.error('Error setting up OSC:', e)
    dialog.showErrorBox('OSCQuery Error', 'Failed to start OSCQuery server.')
    app.quit()
    throw new Error('Failed to set up OSC')
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.nymh.avatar-settings-copy')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('appVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('saveConfig', async (_event, { content, fileName }) => {
    if (!mainWindow) return { success: false }

    if (pendingChanges.size > 0) {
      const changedContent = await avatarConfig(currentAviId, mainWindow, pendingChanges)
      content = JSON.stringify(changedContent)
    }

    const savedConfig = await saveConfig(log, mainWindow, content, fileName)

    pendingChanges.clear()
    return savedConfig
  })

  ipcMain.handle('loadConfig', async () => {
    if (!mainWindow) return

    const dataParsedConfig = await loadConfig(log, mainWindow)

    if (!dataParsedConfig) {
      log.error('No configuration data')
      return null
    }

    pendingChanges.clear()
    const avatarName: string = await getLoadDataName(dataParsedConfig)
    loadedJson = dataParsedConfig

    return { name: avatarName }
  })

  ipcMain.handle('uploadConfig', async () => {
    if (!loadedJson) {
      log.error('No configuration loaded to upload')
      return { success: false }
    }

    pendingChanges.clear()

    const uploadingResult = await uploadConfigIPC(log, loadedJson, OSC_CLIENT)
    return { success: !!uploadingResult }
  })

  createWindow()
  await setupOSC()
  // update(log)
  log.info('App is ready')
})

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('uncaughtException', (e) => {
  console.log('uncaughtException: ', e)
})

process.on('unhandledRejection', (e) => {
  console.error('Unhandled promise rejection:', e)
})
