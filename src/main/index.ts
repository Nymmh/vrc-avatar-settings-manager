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
import { applyPreset } from '../database/applyPreset'
import { updatePreset } from '../database/updatePreset'
import { getAllPresets } from '../database/getAllPresets'
import { updatePresetData } from '../database/updatePresetData'
import { deletePreset } from '../database/deletePreset'
import { createPresetFromApp } from '../database/createPresetFromApp'
import { updateSavedConfigData } from '../database/updateSavedData'
import { uploadAvatarConfig } from '../database/uploadAvatarConfig'
import { loadAvatarConfig } from '../ipc/loadAvatarConfig'
import { getAvatars } from '../database/getAvatars'
import { deleteAvatar } from '../database/deleteAvatar'
import { exportAvatar } from '../file/exportAvatar'
import { updateAvatarData } from '../database/updateAvatarData'
import { exportAllConfigs } from '../file/exportAllConfigs'
import { importAllConfigs } from '../file/importAllConfigs'

let mainWindow: BrowserWindow | null = null
let loadedJson: avatarConfigInterface | null = null
let loadedAvatarJson: loadAvatarConfigFileInterface | null = null
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
    OSC_SERVER.on('message', async (data) => {
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
      } else if (address.includes('Nymh/ASM/Preset/')) {
        address = address.replace('/avatar/parameters/', '')

        const match = address.match(/\/(\d)+\//)

        if (!match) {
          log.error('Invalid address')
          return
        }

        const presetId = parseInt(match[1], 10)

        if (address.includes('Apply')) {
          if (!mainWindow) {
            log.error('Main window is not initialized')
            throw new Error('Main window is not initialized')
          }
          applyPreset(log, mainWindow, avatarDB, currentAviId, presetId, OSC_CLIENT, false)
        } else if (address.includes('Update')) {
          if (!mainWindow) {
            log.error('Main window is not initialized')
            throw new Error('Main window is not initialized')
          }
          await updatePreset(log, avatarDB, presetId, currentAviId, pendingChanges, mainWindow)
          avatarConfig(currentAviId, mainWindow, new Map())
          getNames(log, avatarDB, mainWindow, currentAviId)
        } else log.error('Got "Nymh/ASM/Preset" then hit an error')
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

    content = await avatarConfig(currentAviId, mainWindow, pendingChanges)
    content = JSON.stringify(content)

    const savedConfig = await saveConfig(
      log,
      avatarDB,
      content,
      saveName,
      overwrite,
      nsfw,
      false,
      mainWindow
    )
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

  ipcMain.handle('loadAvatarConfig', async () => {
    if (!mainWindow) return

    loadedAvatarJson = await loadAvatarConfig(log, mainWindow)
    return loadedAvatarJson
  })

  ipcMain.handle('applyConfig', async (_event, id: number) => {
    if (!mainWindow || !currentAviId) return { success: false }

    const res = await applyFromSaved(log, avatarDB, id, currentAviId, OSC_CLIENT, mainWindow)
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

      const uploadingResult = await uploadConfigAndApply(
        log,
        avatarDB,
        loadedJson,
        OSC_CLIENT,
        saveName,
        saveOption,
        currentAviId,
        avatarName,
        mainWindow
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
        saveName,
        nsfw,
        avatarId,
        avatarName,
        loadedJson,
        mainWindow
      )
    }
  )

  ipcMain.handle('refreshAvatarFile', async () => {
    if (!mainWindow || !currentAviId) return { success: false }
    loadedJson = null

    avatarConfig(currentAviId, mainWindow, new Map())
    getNames(log, avatarDB, mainWindow, currentAviId)
    return { success: true }
  })

  ipcMain.handle('getAllSaved', async () => {
    return await getAllSaved(log, avatarDB)
  })

  ipcMain.handle('getAllPresets', async () => {
    return await getAllPresets(log, avatarDB)
  })

  ipcMain.handle('updateConfig', async (_event, id, avatarId, avatarName, saveName, nsfw) => {
    if (!mainWindow) return { success: false }

    return await updateSavedConfig(
      log,
      avatarDB,
      id,
      avatarId,
      avatarName,
      saveName,
      nsfw,
      mainWindow,
      pendingChanges
    )
  })

  ipcMain.handle('updateConfigData', async (_event, id, avatarId, saveName, nsfw) => {
    if (!mainWindow) return { success: false }

    return await updateSavedConfigData(
      log,
      avatarDB,
      id,
      avatarId,
      saveName,
      nsfw,
      mainWindow,
      pendingChanges
    )
  })

  ipcMain.handle('exportConfig', async (_event, id: number) => {
    if (!mainWindow) return { success: false }

    return await exportConfig(log, avatarDB, dialog, mainWindow, id)
  })

  ipcMain.handle('replaceParams', async (_event, id: number) => {
    if (!mainWindow || !currentAviId) return { success: false, message: 'Internal Error' }

    return await replaceParams(log, avatarDB, mainWindow, id)
  })

  ipcMain.handle('deleteConfig', async (_event, id: number) => {
    if (!mainWindow) return { success: false, message: 'Internal Error' }

    return await deleteConfig(log, avatarDB, mainWindow, id)
  })

  ipcMain.handle('applyPresetFromApp', async (_event, avatarId: string, unityParameter: number) => {
    if (!mainWindow) return { success: false }

    return await applyPreset(log, mainWindow, avatarDB, avatarId, unityParameter, OSC_CLIENT, true)
  })

  ipcMain.handle(
    'updatePresetFromApp',
    async (_event, id: number, saveName: string, parameter: number) => {
      if (!mainWindow) return { success: false }

      return await updatePresetData(log, mainWindow, avatarDB, id, saveName, parameter)
    }
  )

  ipcMain.handle('deletePresetFromApp', async (_event, id: number) => {
    if (!mainWindow) return { success: false }

    return await deletePreset(log, mainWindow, avatarDB, id)
  })

  ipcMain.handle('createPresetFromApp', async (_event, id: number) => {
    if (!mainWindow) return { success: false }

    return await createPresetFromApp(log, mainWindow, avatarDB, id)
  })

  ipcMain.handle('getSavedByUqid', async (_event, uqid: string) => {
    return await getAllSaved(log, avatarDB, uqid)
  })

  ipcMain.handle('getPresetsByUqid', async (_event, uqid: string) => {
    return await getAllPresets(log, avatarDB, uqid)
  })

  ipcMain.handle('uploadAvatarConfig', async () => {
    if (!mainWindow) {
      return { upload: false }
    }

    if (!loadedAvatarJson) {
      return { upload: false }
    }

    return await uploadAvatarConfig(log, avatarDB, mainWindow, loadedAvatarJson)
  })

  ipcMain.handle('getAllAvatars', async () => {
    if (!mainWindow) return []

    return await getAvatars(log, avatarDB, mainWindow)
  })

  ipcMain.handle('deleteAvatar', async (_event, avatarId: string) => {
    if (!mainWindow) return { success: false }

    return await deleteAvatar(log, avatarDB, mainWindow, avatarId)
  })

  ipcMain.handle('exportAvatar', async (_event, avatarId: string) => {
    if (!mainWindow) return { success: false }

    return await exportAvatar(log, avatarDB, dialog, mainWindow, avatarId)
  })

  ipcMain.handle('updateAvatarData', async (_event, avatarId: string, name: string) => {
    if (!mainWindow) return { success: false }

    return await updateAvatarData(log, avatarDB, mainWindow, avatarId, name)
  })

  ipcMain.handle('exportAllConfigs', async () => {
    if (!mainWindow) return { success: false }

    return await exportAllConfigs(log, avatarDB, mainWindow, dialog)
  })

  ipcMain.handle('importAllConfigs', async () => {
    if (!mainWindow) return { success: false }

    return await importAllConfigs(log, avatarDB, mainWindow, dialog)
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
