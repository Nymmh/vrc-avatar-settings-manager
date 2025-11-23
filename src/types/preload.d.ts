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
  avatarId: (meowback: (data: avatarIdInterface) => void) => void
  foundAvatarFile: (meowback: (data: foundAvatarFileInterface) => void) => void
  avatarConfig: (meowback: (data: avatarConfigInterface) => void) => void
  saveConfig: (
    data: avatarConfigInterface,
    overwrite: boolean,
    nsfw: boolean
  ) => saveConfigInterface

  loadConfig: () => loadConfigInterface
  uploadConfigAndApply: (
    saveName?: string,
    saveOption: boolean,
    avatarName: string
  ) => uploadConfigAndApplyTypeInterface
  uploadConfig: (
    saveName?: string,
    nsfw: boolean,
    avatarId?: string,
    avatarName?: string
  ) => uploadConfigInterface
  refreshAvatarFile: () => { success: boolean }
  savedNames: (meowback: (data: string[]) => void) => void
  applyConfig: (name: string) => { success: boolean }
  getAllSaved: () => Promise<getAllSavedInterface[] | null>
  updateConfig: (
    id: number,
    avatarId: string | 'Unknown',
    avatarName: string | 'Unknown',
    saveName: string,
    nsfw: boolean
  ) => updateConfigInterface
  exportConfig: (id: number) => exportConfigInterface
  replaceParams: (id: number) => replaceParamsInterface
  deleteConfig: (id: number) => deleteConfigInterface
}

export interface appApi {
  appVersion: () => string
}

declare global {
  interface Window {
    electron: ElectronAPI
    appApi: appApi
    avatarApi: avatarApi
  }
}
