import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { Client } from 'node-osc'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { oscServer } from '../services/server'
import { oscClient } from '../services/client'
import { oscListener } from '../services/listener'
import { oscQuery } from '../services/oscQuery'
import { avatarConfigType } from '../types/avatarConfigType'
import { getLoadDataName } from '../services/getLoadDataName'
import { saveConfig } from '../ipc/saveConfig'
import { loadConfig } from '../ipc/loadConfig'
import { uploadConfigIPC } from '../ipc/uploadConfig'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let loadedJson: avatarConfigType | null = null
let OSC_CLIENT: Client

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.nymh.avatar-settings-copy')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('saveConfig', async (_event, { content, fileName }) => {
    if (mainWindow) {
      const saveResult = await saveConfig(mainWindow, content, fileName)
      return saveResult
    } else return { success: false }
  })

  ipcMain.handle('loadConfig', async () => {
    if (mainWindow) {
      const dataParsedConfig = await loadConfig(mainWindow)
      if (!dataParsedConfig) {
        return null
      }
      const avatarName: string = await getLoadDataName(dataParsedConfig)
      loadedJson = await dataParsedConfig
      return { name: avatarName }
    } else return
  })

  ipcMain.handle('uploadConfig', async () => {
    if (loadedJson != null) {
      const uploadingResult = await uploadConfigIPC(loadedJson, OSC_CLIENT)
      if (uploadingResult) {
        return { success: true }
      } else {
        return { success: false }
      }
    } else {
      return { success: false }
    }
  })

  app.whenReady().then(async () => {
    createWindow()
    const PORT = await oscQuery()
    const OSC_SERVER = await oscServer(PORT)
    OSC_CLIENT = await oscClient()
    if (mainWindow) {
      oscListener(OSC_SERVER, mainWindow)
    }
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
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
