import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { saveConfigInterface } from '../types/saveConfigInterface'
import { loadConfigInterface } from '../types/loadConfigInterface'

const appApi = {
  appVersion: (): Promise<string> => ipcRenderer.invoke('appVersion'),
  getLogFileSize: async (): Promise<string> => ipcRenderer.invoke('getLogFileSize'),
  openLogFile: (): void => {
    ipcRenderer.invoke('openLogFile')
  },
  openExportDirectory: (): void => {
    ipcRenderer.invoke('openExportDirectory')
  },
  deleteLogFile: (): Promise<boolean> => {
    return ipcRenderer.invoke('deleteLogFile')
  },
  getSaveFaceTrackingSetting: (): Promise<boolean> => {
    return ipcRenderer.invoke('getSaveFaceTrackingSetting')
  },
  setSaveFaceTrackingSetting: (value: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('setSaveFaceTrackingSetting', value)
  },
  parameterRateUpdate: (meowback: (rate: string) => void): void => {
    ipcRenderer.on('parameterRateUpdate', (_event: IpcRendererEvent, data: string): void =>
      meowback(data)
    )
  },
  getCopyForDiscordSetting: (): Promise<boolean> => {
    return ipcRenderer.invoke('getCopyForDiscordSetting')
  },
  setCopyForDiscordSetting: (value: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('setCopyForDiscordSetting', value)
  }
}

const avatarApi = {
  avatarId: (meowback: (data: { id: string }) => void): void => {
    ipcRenderer.on('avatarId', (_event: IpcRendererEvent, data: { id: string }): void =>
      meowback(data)
    )
  },
  foundAvatarFile: (meowback: (data: { success: boolean }) => void): void => {
    ipcRenderer.on('foundAvatarFile', (_event: IpcRendererEvent, data: { success: boolean }) =>
      meowback(data)
    )
  },
  avatarConfig: (meowback: (data: avatarDBInterface) => void): void => {
    ipcRenderer.on('avatarConfig', (_event: IpcRendererEvent, data: avatarDBInterface): void =>
      meowback(data)
    )
  },
  saveConfig: async (
    data: avatarDBInterface,
    nsfw: boolean,
    saveName?: string
  ): Promise<saveConfigInterface> => {
    const dataString: string = JSON.stringify(data)
    return ipcRenderer.invoke('saveConfig', {
      content: dataString,
      saveName: saveName?.trim() ? saveName : data?.name || 'Unknown',
      nsfw
    })
  },
  loadConfig: async (): Promise<loadConfigInterface> => ipcRenderer.invoke('loadConfig'),
  uploadConfigAndApply: async (
    saveName?: string,
    saveOption?: boolean,
    avatarName?: string
  ): Promise<uploadConfigAndApplyTypeInterface> =>
    ipcRenderer.invoke('uploadConfigAndApply', saveName, saveOption, avatarName),
  uploadConfig: async (
    saveName?: string,
    nsfw: boolean = false,
    avatarId: string = ''
  ): Promise<uploadConfigInterface> => ipcRenderer.invoke('uploadConfig', saveName, nsfw, avatarId),
  refreshAvatarFile: async (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('refreshAvatarFile'),
  savedNames: (meowback: (data: savedNamesInterface[]) => void): void => {
    ipcRenderer.on(
      'savedNames',
      (
        _event: IpcRendererEvent,
        data: {
          name: string
          id: number
        }[]
      ): void => meowback(data)
    )
  },
  applyConfig: async (id: number): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('applyConfig', id),
  getAllSaved: async (): Promise<avatarDBInterface[] | null> => ipcRenderer.invoke('getAllSaved'),
  updateConfig: async (
    id: number,
    avatarId: string | 'Unknown',
    avatarName: string | 'Unknown',
    saveName: string
  ): Promise<updateConfigInterface> =>
    ipcRenderer.invoke('updateConfig', id, avatarId, avatarName, saveName),
  updateConfigData: async (
    id: number,
    avatarId: string | 'Unknown',
    saveName: string,
    nsfw: boolean | undefined
  ): Promise<updateConfigInterface> =>
    ipcRenderer.invoke('updateConfigData', id, avatarId, saveName, nsfw),
  exportConfig: async (id: number): Promise<exportConfigInterface> =>
    ipcRenderer.invoke('exportConfig', id),
  replaceParams: async (id: number): Promise<replaceParamsInterface> =>
    ipcRenderer.invoke('replaceParams', id),
  deleteConfig: async (id: number): Promise<deleteConfigInterface> =>
    ipcRenderer.invoke('deleteConfig', id),
  getAllPresets: async (): Promise<avatarPresetsInterface[] | null> =>
    ipcRenderer.invoke('getAllPresets'),
  applyPresetFromApp: async (
    avatarId: string,
    unityParameter: number
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('applyPresetFromApp', avatarId, unityParameter),
  updatePresetFromApp: async (
    id: number,
    saveName: string,
    parameter: number
  ): Promise<updatePresetInterface> =>
    ipcRenderer.invoke('updatePresetFromApp', id, saveName, parameter),
  deletePresetFromApp: async (id: number): Promise<deletePresetInterface> =>
    ipcRenderer.invoke('deletePresetFromApp', id),
  createPresetFromApp: async (id: number): Promise<createPresetInterface> =>
    ipcRenderer.invoke('createPresetFromApp', id),
  getConfigByUqid: async (uqid: string): Promise<avatarDBInterface[] | null> =>
    ipcRenderer.invoke('getConfigByUqid', uqid),
  getPresetsByUqid: async (uqid: string): Promise<avatarPresetsInterface[] | null> =>
    ipcRenderer.invoke('getPresetsByUqid', uqid),
  uploadAvatarConfig: async (): Promise<uploadAvatarConfigInterface> =>
    ipcRenderer.invoke('uploadAvatarConfig'),
  loadAvatarConfig: async (): Promise<loadAvatarConfigInterface> =>
    ipcRenderer.invoke('loadAvatarConfig'),
  getAllAvatars: async (): Promise<getAllAvatarsInterface[]> => ipcRenderer.invoke('getAllAvatars'),
  deleteAvatar: async (avatarId: string): Promise<deleteAvatarInterface> =>
    ipcRenderer.invoke('deleteAvatar', avatarId),
  exportAvatar: async (avatarId: string): Promise<exportAvatarInterface> =>
    ipcRenderer.invoke('exportAvatar', avatarId),
  updateAvatarData: async (
    avatarId: string,
    name: string,
    updateId: string
  ): Promise<updateAvatarDataInterface> =>
    ipcRenderer.invoke('updateAvatarData', avatarId, name, updateId),
  exportAllConfigs: async (): Promise<exportAllConfigsInterface> =>
    ipcRenderer.invoke('exportAllConfigs'),
  importAllConfigs: async (): Promise<importAllConfigsInterface> =>
    ipcRenderer.invoke('importAllConfigs'),
  getConfigById: async (avatarId: string): Promise<avatarDBInterface[] | null> =>
    ipcRenderer.invoke('getConfigById', avatarId),
  dataTableRefresh: (meowback: () => void): void => {
    ipcRenderer.on('dataTableRefresh', (): void => meowback())
  },
  copyConfigCode: async (id: number): Promise<exportConfigInterface> =>
    ipcRenderer.invoke('copyConfigCode', id),
  applyCopiedCode: async (): Promise<exportConfigInterface> => ipcRenderer.invoke('applyCopiedCode')
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
