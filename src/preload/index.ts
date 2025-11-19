import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { avatarConfigType } from '../types/avatarConfigType'
import { saveConfigExport } from '../ipc/saveConfig'
import { uploadConfigType } from '../types/uploadConfigType'
import { loadConfigType } from '../types/loadConfigType'

const appApi = {
  appVersion: (): Promise<string> => {
    return ipcRenderer.invoke('appVersion')
  }
}

const avatarApi = {
  avatarId: (meowback: (data: { id: string }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { id: string }): void => meowback(data)
    ipcRenderer.on('avatarId', listener)
    return
  },
  foundAvatarFile: (meowback: (data: { success: boolean }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { success: boolean }): void => meowback(data)
    ipcRenderer.on('foundAvatarFile', listener)
    return
  },
  avatarConfig: (meowback: (data: { data: avatarConfigType }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { data: avatarConfigType }): void =>
      meowback(data)
    ipcRenderer.on('avatarConfig', listener)
    return
  },
  saveConfig: async (data: avatarConfigType): Promise<saveConfigExport> => {
    const dataString: string = JSON.stringify(data)
    return ipcRenderer.invoke('saveConfig', {
      content: dataString,
      fileName: data?.name || 'avatar config'
    })
  },
  loadConfig: async (): Promise<loadConfigType> => {
    return ipcRenderer.invoke('loadConfig')
  },
  uploadConfig: async (): Promise<uploadConfigType> => {
    return ipcRenderer.invoke('uploadConfig')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('appApi', appApi)
    contextBridge.exposeInMainWorld('avatarApi', avatarApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.appApi = appApi
  // @ts-ignore (define in dts)
  window.avatarApi = avatarApi
}
