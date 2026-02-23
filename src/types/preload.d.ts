import { ElectronAPI } from '@electron-toolkit/preload'
import { saveConfigInterface } from './saveConfigInterface'
import { loadConfigInterface } from './loadConfigInterface'

export interface avatarIdInterface {
  id: string
}

export interface foundAvatarFileInterface {
  success: boolean
}

export interface avatarApi {
  avatarId: (meowback: (data: avatarIdInterface) => void) => () => void
  foundAvatarFile: (meowback: (data: foundAvatarFileInterface) => void) => () => void
  avatarConfig: (meowback: (data: avatarConfigInterface) => void) => () => void
  saveConfig: (data: avatarConfigInterface, nsfw: boolean, saveName?: string) => saveConfigInterface
  loadConfig: () => loadConfigInterface
  uploadConfigAndApply: (
    saveName?: string,
    saveOption: boolean,
    avatarName: string
  ) => uploadConfigAndApplyTypeInterface
  uploadConfig: (saveName?: string, nsfw: boolean, avatarId?: string) => uploadConfigInterface
  refreshAvatarFile: () => { success: boolean }
  savedNames: (meowback: (data: savedNamesInterface[]) => void) => () => void
  applyConfig: (id: number) => { success: boolean }
  getAllSaved: () => Promise<getAllSavedInterface[] | null>
  updateConfig: (
    id: number,
    avatarId: string | 'Unknown',
    avatarName: string | 'Unknown',
    saveName: string | undefined
  ) => updateConfigInterface
  updateConfigData: (
    id: number,
    avatarId: string | 'Unknown',
    saveName: string | undefined,
    nsfw: boolean | undefined
  ) => updateConfigInterface
  exportConfig: (id: number) => exportConfigInterface
  replaceParams: (id: number) => replaceParamsInterface
  deleteConfig: (id: number) => deleteConfigInterface
  getAllPresets: () => Promise<getAllPresetsInterface[] | null>
  applyPresetFromApp: (avatarId: string, unityParameter: number) => { success: boolean }
  updatePresetFromApp: (id: number, saveName: string, parameter: number) => updatePresetInterface
  deletePresetFromApp: (id: number) => deletePresetInterface
  createPresetFromApp: (id: number) => createPresetInterface
  getConfigByUqid: (uqid: string) => Promise<getAllSavedInterface[] | null>
  getPresetsByUqid: (uqid: string) => Promise<getAllPresetsInterface[] | null>
  uploadAvatarConfig: () => Promise<uploadAvatarConfigInterface>
  loadAvatarConfig: () => Promise<loadAvatarConfigInterface>
  getAllAvatars: () => Promise<getAllAvatarsInterface[]>
  deleteAvatar: (avatarId: string) => Promise<deleteAvatarInterface>
  exportAvatar: (avatarId: string) => Promise<exportAvatarInterface>
  updateAvatarData: (
    avatarId: string,
    name: string,
    updateId: string
  ) => Promise<updateAvatarDataInterface>
  exportAllConfigs: () => Promise<exportAllConfigsPromiseInterface>
  importAllConfigs: () => Promise<importAllConfigsInterface>
  getConfigById: (avatarId: string) => Promise<avatarDBInterface[] | null>
  dataTableRefresh: (meowback: () => void) => () => void
  getLogFileSize: () => Promise<string>
  copyConfigCode: (id: number) => exportConfigInterface
  applyCopiedCode: () => exportConfigInterface
  copyAvatarId: () => Promise<boolean>
  randomParams: () => Promise<boolean>
}

export interface appApi {
  appVersion: () => string
  getLogFileSize: () => Promise<string>
  openLogFile: () => void
  deleteLogFile: () => Promise<boolean>
  getSaveFaceTrackingSetting: () => Promise<boolean>
  setSaveFaceTrackingSetting: (value: boolean) => Promise<boolean>
  parameterRateUpdate: (meowback: (rate: string) => void) => () => void
  openExportDirectory: () => void
  getCopyForDiscordSetting: () => Promise<boolean>
  setCopyForDiscordSetting: (value: boolean) => Promise<boolean>
  deleteDatabase: () => Promise<boolean>
  getExportedFileCount: () => Promise<exportedFileCountInterface>
  isVRChatRunning: () => Promise<boolean>
  onVRChatStatusChanged: (meowback: (data: { isRunning: boolean }) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    appApi: appApi
    avatarApi: avatarApi
  }
}
