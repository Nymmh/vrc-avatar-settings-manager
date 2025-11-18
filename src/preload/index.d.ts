import { ElectronAPI } from '@electron-toolkit/preload'

export type avatarIdType = {
  id: string
}

export type foundAvatarFileType = {
  success: boolean
}

export type avatarConfigType = {
  id: string
  name: string
  animationParameters: [
    {
      name?: string
      value?: number
    }
  ]
}

export type saveConfigType = {
  success: boolean
  filePath?: string
}

export interface avatarApi {
  avatarId: (meowback: (data: avatarIdType) => void) => void
  foundAvatarFile: (meowback: (data: foundAvatarFileType) => void) => void
  avatarConfig: (meowback: ({ avatarConfigType }) => void) => void
  saveConfig: (meowback: (data: avatarConfigType) => void) => saveConfigType
  loadConfig: () => { name: string }
  uploadConfig: () => { success: boolean }
}

declare global {
  interface Window {
    electron: ElectronAPI
    avatarApi: avatarApi
  }
}
