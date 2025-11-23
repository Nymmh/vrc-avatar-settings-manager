import path from 'path'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { Client } from 'node-osc'
import log from 'electron-log/main'
import { avatarDatabase } from './avatarDatabase'
import { getAllSaved } from '../database/getAllSaved'
import { getNames } from '../database/getSavedNames'
import { updateSavedConfig } from '../database/updateSavedConfig'
import { replaceParams } from '../database/replaceParams'
import { deleteConfig } from '../database/deleteConfig'
import { saveConfig } from '../ipc/saveConfig'
import { loadConfig } from '../ipc/loadConfig'
import { uploadConfig } from '../ipc/uploadConfig'
import { uploadConfigAndApply } from '../ipc/uploadConfigAndApply'
import { applyFromSaved } from '../ipc/applyFromSaved'
import { oscClient } from '../osc/oscClient'
import { oscServer } from '../osc/oscServer'
import { oscQuery } from '../osc/oscQuery'
import { avatarConfig } from '../services/avatarConfig'
import { checkDataFolder } from '../file/checkDataFolder'
import { exportConfig } from '../file/exportConfig'
import { getLoadDataName } from '../helpers/getLoadDataName'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let loadedJson: avatarConfigInterface | null = null
let currentAviId: string = ''
const pendingChanges: Map<string, unknown> = new Map()
let OSC_CLIENT: Client

const dataFolder = checkDataFolder()

log.initialize()
log.transports.file.resolvePathFn = () => path.join(dataFolder.folderPath, 'meow.log')
log.transports.file.fileName = 'meow.log'
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}] [{level}] {text}'
log.transports.file.level = 'info'
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
    const OSC_SERVER = await oscServer(log, PORT)
    OSC_CLIENT = await oscClient(log)

    if (!mainWindow) {
      log.error('Main window is not initialized')
      throw new Error('Main window is not initialized')
    }

    if (!OSC_SERVER) {
      log.error('Server is not started')
      throw new Error('Server is not started')
    }

    log.info('Listener ready')
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
        loadedJson = null
        mainWindow.webContents.send('avatarId', { id: payload })
        currentAviId = payload
        avatarConfig(payload, mainWindow, new Map())
        getNames(log, avatarDB, mainWindow, currentAviId)
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
  electronApp.setAppUserModelId('com.nymh.avatar-settings-manager')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('appVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('saveConfig', async (_event, { content, saveName, overwrite, nsfw }) => {
    if (!mainWindow) return { success: false }

    if (pendingChanges.size > 0) {
      const changedContent = await avatarConfig(currentAviId, mainWindow, pendingChanges)
      content = JSON.stringify(changedContent)
    }

    pendingChanges.clear()
    const savedConfig = await saveConfig(log, avatarDB, content, saveName, overwrite, nsfw, false)
    getNames(log, avatarDB, mainWindow, currentAviId)
    return savedConfig
  })

  ipcMain.handle('loadConfig', async () => {
    if (!mainWindow) return

    const dataParsedConfig = await loadConfig(log, mainWindow)

    if (!dataParsedConfig) {
      log.error('No file data')
      return { name: '', match: false, error: 'No file data' }
    }

    pendingChanges.clear()

    if (!dataParsedConfig.id) {
      return { name: '', match: false, error: 'Loaded config is missing ID' }
    }

    if (!dataParsedConfig.name) {
      return { name: '', match: false, error: 'Loaded config is missing name' }
    }

    const avatarName: string = await getLoadDataName(dataParsedConfig)
    loadedJson = dataParsedConfig

    return { name: avatarName, match: dataParsedConfig.id === currentAviId, error: '' }
  })

  ipcMain.handle('applyConfig', async (_event, name: string) => {
    if (!mainWindow || !currentAviId) return { success: false }

    pendingChanges.clear()

    const res = await applyFromSaved(log, avatarDB, name, currentAviId, OSC_CLIENT, mainWindow)
    return { success: !!res }
  })

  ipcMain.handle(
    'uploadConfigAndApply',
    async (_event, saveName: string | '', saveOption: boolean, avatarName: string | 'Unknown') => {
      if (!mainWindow || !currentAviId) {
        return { success: false }
      }

      if (!loadedJson) {
        log.error('No configuration loaded to upload')
        return { success: false }
      }

      pendingChanges.clear()

      const uploadingResult = await uploadConfigAndApply(
        log,
        avatarDB,
        loadedJson,
        OSC_CLIENT,
        saveName,
        saveOption,
        mainWindow,
        currentAviId,
        avatarName
      )
      getNames(log, avatarDB, mainWindow, currentAviId)
      return uploadingResult
    }
  )

  ipcMain.handle(
    'uploadConfig',
    async (
      _event,
      saveName: string | '',
      nsfw: boolean,
      avatarId: string | '',
      avatarName: string | ''
    ) => {
      if (!mainWindow || !loadedJson) {
        return { success: false }
      }

      return await uploadConfig(
        log,
        avatarDB,
        mainWindow,
        saveName,
        nsfw,
        avatarId,
        avatarName,
        loadedJson
      )
    }
  )

  ipcMain.handle('refreshAvatarFile', async () => {
    if (!mainWindow || !currentAviId) return { success: false }
    pendingChanges.clear()
    loadedJson = null

    avatarConfig(currentAviId, mainWindow, new Map())
    getNames(log, avatarDB, mainWindow, currentAviId)
    return { success: true }
  })

  ipcMain.handle('getAllSaved', async () => {
    return await getAllSaved(log, avatarDB)
  })

  ipcMain.handle('updateConfig', async (_event, id, avatarId, avatarName, saveName, nsfw) => {
    if (!mainWindow) {
      return { success: false }
    }

    return await updateSavedConfig(log, avatarDB, id, avatarId, avatarName, saveName, nsfw)
  })

  ipcMain.handle('exportConfig', async (_event, id: number) => {
    if (!mainWindow) {
      return { success: false }
    }

    return await exportConfig(log, avatarDB, dialog, mainWindow, id)
  })

  ipcMain.handle('replaceParams', async (_event, id: number) => {
    if (!mainWindow || !currentAviId) {
      return { success: false, message: 'Internal Error' }
    }

    return await replaceParams(log, avatarDB, mainWindow, id)
  })

  ipcMain.handle('deleteConfig', async (_event, id: number) => {
    if (!mainWindow) {
      return { success: false, message: 'Internal Error' }
    }

    return await deleteConfig(log, avatarDB, mainWindow, id)
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
  log.error('Uncaught Exception:', e)
})

process.on('unhandledRejection', (e) => {
  log.error('Unhandled Promise Rejection:', e)
})
