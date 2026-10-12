import type { appApiInterface, avatarApiInterface, ipcEventInterface } from './ipc'

export type appApi = appApiInterface
export type avatarApi = avatarApiInterface
export type avatarIdInterface = ipcEventInterface['avatarId']
export type foundAvatarFileInterface = ipcEventInterface['foundAvatarFile']

declare global {
  interface Window {
    appApi: appApiInterface
    avatarApi: avatarApiInterface
  }
}
