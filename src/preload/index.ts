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
  parameterRateUpdate: (meowback: (rate: string) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, data: string): void => meowback(data)
    ipcRenderer.on('parameterRateUpdate', handler)
    return () => ipcRenderer.removeListener('parameterRateUpdate', handler)
  },
  getCopyForDiscordSetting: (): Promise<boolean> => {
    return ipcRenderer.invoke('getCopyForDiscordSetting')
  },
  setCopyForDiscordSetting: (value: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('setCopyForDiscordSetting', value)
  },
  deleteDatabase: (): Promise<boolean> => {
    return ipcRenderer.invoke('deleteDatabase')
  },
  getExportedFileCount: (): Promise<exportedFileCountInterface> => {
    return ipcRenderer.invoke('getExportedFileCount')
  },
  isVRChatRunning: (): Promise<boolean> => {
    return ipcRenderer.invoke('isVRChatRunning')
  },
  onVRChatStatusChanged: (meowback: (data: { isRunning: boolean }) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, data: { isRunning: boolean }): void => meowback(data)
    ipcRenderer.on('vrchat-status-changed', handler)
    return () => ipcRenderer.removeListener('vrchat-status-changed', handler)
  },
  getApplyConfigBufferSetting: (): Promise<boolean> => {
    return ipcRenderer.invoke('getApplyConfigBufferSetting')
  },
  setApplyConfigBufferSetting: (value: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('setApplyConfigBufferSetting', value)
  },
  getLowPerformanceModeSetting: (): Promise<boolean> => {
    return ipcRenderer.invoke('getLowPerformanceModeSetting')
  },
  setLowPerformanceModeSetting: (value: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('setLowPerformanceModeSetting', value)
  },
  getTiplinkWebhookSecret: (): Promise<string> => {
    return ipcRenderer.invoke('getTiplinkWebhookSecret')
  },
  getTiplinkWebhookSecretInfo: (): Promise<{
    previousSecretExpiresAt: number | null
    hasGraceWindow: boolean
    rotationWindowMs: number
  }> => {
    return ipcRenderer.invoke('getTiplinkWebhookSecretInfo')
  },
  copyTiplinkWebhookSecret: (): Promise<boolean> => {
    return ipcRenderer.invoke('copyTiplinkWebhookSecret')
  },
  rotateTiplinkWebhookSecret: (): Promise<{
    secret: string
    previousSecretExpiresAt: number | null
  } | null> => {
    return ipcRenderer.invoke('rotateTiplinkWebhookSecret')
  },
  resetTiplinkWebhookSecret: (value: string): Promise<boolean> => {
    return ipcRenderer.invoke('resetTiplinkWebhookSecret', value)
  }
}

const avatarApi = {
  avatarId: (meowback: (data: { id: string }) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, data: { id: string }): void => meowback(data)
    ipcRenderer.on('avatarId', handler)
    return () => ipcRenderer.removeListener('avatarId', handler)
  },
  foundAvatarFile: (meowback: (data: { success: boolean }) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, data: { success: boolean }): void => meowback(data)
    ipcRenderer.on('foundAvatarFile', handler)
    return () => ipcRenderer.removeListener('foundAvatarFile', handler)
  },
  avatarConfig: (meowback: (data: avatarDBInterface) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, data: avatarDBInterface): void => meowback(data)
    ipcRenderer.on('avatarConfig', handler)
    return () => ipcRenderer.removeListener('avatarConfig', handler)
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
  savedNames: (meowback: (data: savedNamesInterface[]) => void): (() => void) => {
    const handler = (
      _event: IpcRendererEvent,
      data: {
        name: string
        id: number
      }[]
    ): void => meowback(data)
    ipcRenderer.on('savedNames', handler)
    return () => ipcRenderer.removeListener('savedNames', handler)
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
  dataTableRefresh: (meowback: () => void): (() => void) => {
    const handler = (): void => meowback()
    ipcRenderer.on('dataTableRefresh', handler)
    return () => ipcRenderer.removeListener('dataTableRefresh', handler)
  },
  copyConfigCode: async (id: number): Promise<exportConfigInterface> =>
    ipcRenderer.invoke('copyConfigCode', id),
  applyCopiedCode: async (): Promise<exportConfigInterface> =>
    ipcRenderer.invoke('applyCopiedCode'),
  copyAvatarId: async (): Promise<{ success: boolean }> => ipcRenderer.invoke('copyAvatarId'),
  randomParams: async (): Promise<{ success: boolean }> => ipcRenderer.invoke('randomParams')
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
