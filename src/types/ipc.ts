import type { OSCStartupStatus } from './oscStartupStatus'
import type { saveConfigInterface } from './saveConfigInterface'
import type { loadConfigInterface } from './loadConfigInterface'

export interface operationResultInterface {
  success: boolean
  message?: string
  cancelled?: boolean
}

interface appInvokeInterface {
  skipVRChatCheck: () => boolean
  appVersion: () => string
  getLogFileSize: () => string
  openLogFile: () => void
  openExportDirectory: () => void
  deleteLogFile: () => boolean
  getSaveFaceTrackingSetting: () => boolean
  setSaveFaceTrackingSetting: (value: boolean) => boolean
  getCopyForDiscordSetting: () => boolean
  setCopyForDiscordSetting: (value: boolean) => boolean
  deleteDatabase: () => boolean
  getExportedFileCount: () => exportedFileCountInterface | null
  isVRChatRunning: () => boolean
  getApplyConfigBufferSetting: () => boolean
  setApplyConfigBufferSetting: (value: boolean) => boolean
  getLowPerformanceModeSetting: () => boolean
  setLowPerformanceModeSetting: (value: boolean) => boolean
}

export interface savedPresetInterface {
  id: number
  forUqid: string
  avatarId: string
  name: string
  unityParameter: number | null
}

interface avatarInvokeInterface {
  saveConfig: (data: { content: string; saveName: string; nsfw: boolean }) => saveConfigInterface
  loadConfig: () => loadConfigInterface | undefined
  uploadConfigAndApply: (
    saveName?: string,
    saveOption?: boolean,
    avatarName?: string
  ) => uploadConfigAndApplyTypeInterface
  uploadConfig: (saveName?: string, nsfw?: boolean, avatarId?: string) => uploadConfigInterface
  refreshAvatarFile: () => { success: boolean; avatarId: string }
  applyConfig: (id: number) => operationResultInterface
  getAllSaved: () => avatarDBInterface[] | null
  updateConfig: (
    id: number,
    avatarId: string,
    avatarName: string,
    saveName: string | undefined
  ) => updateConfigInterface
  updateConfigData: (
    id: number,
    avatarId: string,
    saveName: string | undefined,
    nsfw: boolean | undefined
  ) => updateConfigInterface
  exportConfig: (id: number) => exportConfigInterface
  replaceParams: (id: number) => replaceParamsInterface
  deleteConfig: (id: number) => deleteConfigInterface
  getAllPresets: () => savedPresetInterface[] | null
  applyPresetFromApp: (
    avatarId: string,
    unityParameter: number
  ) => boolean | operationResultInterface
  updatePresetFromApp: (id: number, saveName: string, parameter: number) => updatePresetInterface
  deletePresetFromApp: (id: number) => deletePresetInterface
  createPresetFromApp: (id: number) => createPresetInterface
  getConfigByUqid: (uqid: string) => avatarDBInterface[] | null
  getPresetsByUqid: (uqid: string) => savedPresetInterface[] | null
  uploadAvatarConfig: () => uploadAvatarConfigInterface
  loadAvatarConfig: () => exportAllConfigsInterface | operationResultInterface | null | undefined
  getAllAvatars: () => getAllAvatarsInterface[] | null
  deleteAvatar: (avatarId: string) => deleteAvatarInterface
  exportAvatar: (avatarId: string) => exportAvatarInterface
  updateAvatarData: (avatarId: string, name: string, updateId: string) => updateAvatarDataInterface
  exportAllConfigs: () => exportAllConfigsPromiseInterface
  importAllConfigs: () => importAllConfigsInterface
  getConfigById: (avatarId: string) => avatarDBInterface[] | null
  copyConfigCode: (id: number) => exportConfigInterface
  applyCopiedCode: () => operationResultInterface | avatarDBInterface
  copyAvatarId: () => operationResultInterface
  randomParams: () => boolean | operationResultInterface
}

export interface ipcInvokeInterface extends appInvokeInterface, avatarInvokeInterface {}

export type ipcChannelType = keyof ipcInvokeInterface
export type ipcArgsType<Ch extends ipcChannelType> = Parameters<ipcInvokeInterface[Ch]>
export type ipcResultType<Ch extends ipcChannelType> = ReturnType<ipcInvokeInterface[Ch]>

type invokeApiType<Channels extends ipcChannelType> = {
  [Ch in Channels]: (...args: ipcArgsType<Ch>) => Promise<ipcResultType<Ch>>
}

export interface ipcEventInterface {
  'osc-startup-status': OSCStartupStatus
  parameterRateUpdate: string
  'vrchat-status-changed': { isRunning: boolean }
  avatarId: { id: string }
  foundAvatarFile: { success: boolean }
  avatarConfig: avatarDBInterface
  savedNames: savedNamesInterface[]
  dataTableRefresh: void
}

type subscriptionType<Ei extends keyof ipcEventInterface> = (
  callback: (data: ipcEventInterface[Ei]) => void
) => () => void

export type appApiInterface = invokeApiType<keyof appInvokeInterface> & {
  onOSCStartupStatus: subscriptionType<'osc-startup-status'>
  parameterRateUpdate: subscriptionType<'parameterRateUpdate'>
  onVRChatStatusChanged: subscriptionType<'vrchat-status-changed'>
}

export type avatarApiInterface = Omit<
  invokeApiType<keyof avatarInvokeInterface>,
  'saveConfig' | 'randomParams' | 'applyPresetFromApp' | 'applyCopiedCode'
> & {
  saveConfig: (
    data: avatarDBInterface,
    nsfw: boolean,
    saveName?: string
  ) => Promise<saveConfigInterface>
  randomParams: () => Promise<operationResultInterface>
  applyPresetFromApp: (
    avatarId: string,
    unityParameter: number
  ) => Promise<operationResultInterface>
  applyCopiedCode: () => Promise<operationResultInterface>
  avatarId: subscriptionType<'avatarId'>
  foundAvatarFile: subscriptionType<'foundAvatarFile'>
  avatarConfig: subscriptionType<'avatarConfig'>
  savedNames: subscriptionType<'savedNames'>
  dataTableRefresh: subscriptionType<'dataTableRefresh'>
}
