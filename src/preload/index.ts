import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { saveConfigInterface } from '../types/saveConfigInterface'
import { loadConfigInterface } from '../types/loadConfigInterface'

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
  avatarConfig: (meowback: (data: avatarConfigInterface) => void) => {
    const listener = (_event: IpcRendererEvent, data: avatarConfigInterface): void => meowback(data)
    ipcRenderer.on('avatarConfig', listener)
    return
  },
  saveConfig: async (
    data: avatarConfigInterface,
    overwrite: boolean,
    nsfw: boolean
  ): Promise<saveConfigInterface> => {
    const dataString: string = JSON.stringify(data)
    return ipcRenderer.invoke('saveConfig', {
      content: dataString,
      saveName: data?.name || 'avatar',
      overwrite,
      nsfw
    })
  },
  loadConfig: async (): Promise<loadConfigInterface> => {
    return ipcRenderer.invoke('loadConfig')
  },
  uploadConfigAndApply: async (
    saveName?: string,
    saveOption?: boolean,
    avatarName?: string
  ): Promise<uploadConfigAndApplyTypeInterface> => {
    return ipcRenderer.invoke('uploadConfigAndApply', saveName, saveOption, avatarName)
  },
  refreshAvatarFile: async (): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('refreshAvatarFile')
  },
  savedNames: (meowback: (data: string[]) => void) => {
    const listener = (_event: IpcRendererEvent, data: string[]): void => meowback(data)
    ipcRenderer.on('savedNames', listener)
    return
  },
  applyConfig: async (name: string): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('applyConfig', name)
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
