import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

import type {
  appApiInterface,
  avatarApiInterface,
  ipcArgsType,
  ipcChannelType,
  ipcResultType,
  ipcEventInterface
} from '../types/ipc'

function invoke<Ch extends ipcChannelType>(
  channel: Ch,
  ...args: ipcArgsType<Ch>
): Promise<ipcResultType<Ch>> {
  return ipcRenderer.invoke(channel, ...args)
}

function subscribe<Ei extends keyof ipcEventInterface>(
  channel: Ei,
  callback: (data: ipcEventInterface[Ei]) => void
): () => void {
  const handler = (_event: IpcRendererEvent, data: ipcEventInterface[Ei]): void => callback(data)
  ipcRenderer.on(channel, handler)
  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

const appApi: appApiInterface = {
  skipVRChatCheck: () => invoke('skipVRChatCheck'),
  onOSCStartupStatus: (callback) => {
    const unsubscribe = subscribe('osc-startup-status', callback)
    ipcRenderer.send('osc-startup-subscribe')
    return unsubscribe
  },
  appVersion: () => invoke('appVersion'),
  getLogFileSize: async () => invoke('getLogFileSize'),
  openLogFile: () => invoke('openLogFile'),
  openExportDirectory: () => invoke('openExportDirectory'),
  deleteLogFile: () => invoke('deleteLogFile'),
  getSaveFaceTrackingSetting: () => invoke('getSaveFaceTrackingSetting'),
  setSaveFaceTrackingSetting: (value) => invoke('setSaveFaceTrackingSetting', value),
  parameterRateUpdate: (callback) => subscribe('parameterRateUpdate', callback),
  getCopyForDiscordSetting: () => invoke('getCopyForDiscordSetting'),
  setCopyForDiscordSetting: (value) => invoke('setCopyForDiscordSetting', value),
  deleteDatabase: () => invoke('deleteDatabase'),
  getExportedFileCount: () => invoke('getExportedFileCount'),
  isVRChatRunning: () => invoke('isVRChatRunning'),
  onVRChatStatusChanged: (callback) => subscribe('vrchat-status-changed', callback),
  getApplyConfigBufferSetting: () => invoke('getApplyConfigBufferSetting'),
  setApplyConfigBufferSetting: (value) => invoke('setApplyConfigBufferSetting', value),
  getLowPerformanceModeSetting: () => invoke('getLowPerformanceModeSetting'),
  setLowPerformanceModeSetting: (value) => invoke('setLowPerformanceModeSetting', value)
}

const avatarApi: avatarApiInterface = {
  avatarId: (callback) => subscribe('avatarId', callback),
  foundAvatarFile: (callback) => subscribe('foundAvatarFile', callback),
  avatarConfig: (callback) => subscribe('avatarConfig', callback),
  saveConfig: async (data, nsfw, saveName) => {
    return invoke('saveConfig', {
      content: JSON.stringify(data),
      saveName: saveName?.trim() ? saveName : data?.name || 'Unknown',
      nsfw
    })
  },
  loadConfig: async () => invoke('loadConfig'),
  uploadConfigAndApply: async (saveName, saveOption, avatarName) =>
    invoke('uploadConfigAndApply', saveName, saveOption, avatarName),
  uploadConfig: async (saveName, nsfw = false, avatarId = '') =>
    invoke('uploadConfig', saveName, nsfw, avatarId),
  refreshAvatarFile: async () => invoke('refreshAvatarFile'),
  savedNames: (callback) => subscribe('savedNames', callback),
  applyConfig: async (id) => invoke('applyConfig', id),
  getAllSaved: async () => invoke('getAllSaved'),
  updateConfig: async (id, avatarId, avatarName, saveName) =>
    invoke('updateConfig', id, avatarId, avatarName, saveName),
  updateConfigData: async (id, avatarId, saveName, nsfw) =>
    invoke('updateConfigData', id, avatarId, saveName, nsfw),
  exportConfig: async (id) => invoke('exportConfig', id),
  replaceParams: async (id) => invoke('replaceParams', id),
  deleteConfig: async (id) => invoke('deleteConfig', id),
  getAllPresets: async () => invoke('getAllPresets'),
  applyPresetFromApp: async (avatarId, unityParameter) => {
    const result = await invoke('applyPresetFromApp', avatarId, unityParameter)
    return typeof result === 'boolean' ? { success: result } : result
  },
  updatePresetFromApp: async (id, saveName, parameter) =>
    invoke('updatePresetFromApp', id, saveName, parameter),
  deletePresetFromApp: async (id) => invoke('deletePresetFromApp', id),
  createPresetFromApp: async (id) => invoke('createPresetFromApp', id),
  getConfigByUqid: async (uqid) => invoke('getConfigByUqid', uqid),
  getPresetsByUqid: async (uqid) => invoke('getPresetsByUqid', uqid),
  uploadAvatarConfig: async () => invoke('uploadAvatarConfig'),
  loadAvatarConfig: async () => invoke('loadAvatarConfig'),
  getAllAvatars: async () => invoke('getAllAvatars'),
  deleteAvatar: async (avatarId) => invoke('deleteAvatar', avatarId),
  exportAvatar: async (avatarId) => invoke('exportAvatar', avatarId),
  updateAvatarData: async (avatarId, name, updateId) =>
    invoke('updateAvatarData', avatarId, name, updateId),
  exportAllConfigs: async () => invoke('exportAllConfigs'),
  importAllConfigs: async () => invoke('importAllConfigs'),
  getConfigById: async (avatarId) => invoke('getConfigById', avatarId),
  dataTableRefresh: (callback) => subscribe('dataTableRefresh', callback),
  copyConfigCode: async (id) => invoke('copyConfigCode', id),
  applyCopiedCode: async () => {
    const result = await invoke('applyCopiedCode')
    return 'success' in result
      ? result
      : { success: false, message: 'Use Upload Avatar From File to import an avatar share code.' }
  },
  copyAvatarId: async () => invoke('copyAvatarId'),
  randomParams: async () => {
    const result = await invoke('randomParams')
    return typeof result === 'boolean' ? { success: result } : result
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
  window.appApi = appApi
  window.avatarApi = avatarApi
}
