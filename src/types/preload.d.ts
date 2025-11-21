import { ElectronAPI } from '@electron-toolkit/preload'
import { saveConfigInterface } from './saveConfigInterface'

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

  loadConfig: () => { name: string; match: boolean; error?: string }
  uploadConfigAndApply: (
    saveName?: string,
    saveOption: boolean,
    avatarName: string
  ) => uploadConfigAndApplyTypeInterface
  refreshAvatarFile: () => { success: boolean }
  savedNames: (meowback: (data: string[]) => void) => void
  applyConfig: (name: string) => { success: boolean }
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
