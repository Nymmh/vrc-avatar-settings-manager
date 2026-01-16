interface avatarDB {
  type?: string
  id?: number
  uqid?: string
  avatarId?: string
  name?: string
  avatarName?: string
  nsfw?: number
  parameters?: string
  valuedParams?: valuedParams[] | string
  fromFile?: number
  isPreset?: number
  presets?: avatarPresets
}

interface valuedParams {
  name?: string
  value?: number | boolean | string
  type?: string
}

interface avatarPresets {
  id?: number
  forUqid?: string
  avatarId?: string
  name?: string
  unityParameter?: number
}

interface exportAllConfig {
  type?: string
  avatarId?: string
  name?: string
  configs?: avatarDB[]
  valuedParams?: valuedParams[] | string
  version?: string
}

interface exportedFullData {
  version: string
  avatars: exportAllConfig[]
}

interface avatarStorageDB {
  avatarId?: string
  name?: string
}

interface exportAllConfigsPromise {
  success: boolean
  message?: string
}

interface importAllConfigsPromise {
  success: boolean
  message?: string
}

interface uploadConfigAndApplyType {
  upload: boolean
  save?: boolean
  saveMessage?: string
}

interface uploadConfigType {
  upload: boolean
  saveMessage?: string
}

interface savedNamesType {
  id: number
  name: string
}

interface updateConfig {
  success: boolean
  message?: string
}

interface exportConfig {
  success: boolean
  message?: string
}

interface replaceParams {
  success: boolean
  message?: string
}

interface deleteConfig {
  success: boolean
  message?: string
}

interface updatePreset {
  success: boolean
  message?: string
}

interface deletePreset {
  success: boolean
  message?: string
}

interface createPreset {
  success: boolean
  message?: string
}

interface uploadAvatarConfig {
  success: boolean
  message?: string
}

interface loadAvatarConfig {
  name: string
}

interface getAllAvatars {
  avatarId: string
  name: string
}

interface deleteAvatarType {
  success: boolean
  message?: string
}

interface exportAvatarType {
  success: boolean
  message?: string
}

interface updateAvatarData {
  success: boolean
  message?: string
}

interface applyFromSaved {
  avatarId: string
  nsfw: number
  parameters: string
}

interface exportedFileCount {
  fullExports: number
  avatarExports: number
  configExports: number
  totalSize: string
}

declare global {
  interface exportAllConfigsInterface extends exportAllConfig {}
  interface exportAllDataInterface extends exportedFullData {}
  interface avatarDBInterface extends avatarDB {}
  interface avatarStorageDBInterface extends avatarStorageDB {}
  interface exportAllConfigsPromiseInterface extends exportAllConfigsPromise {}
  interface avatarPresetsInterface extends avatarPresets {}
  interface importAllConfigsInterface extends importAllConfigsPromise {}
  interface uploadConfigAndApplyTypeInterface extends uploadConfigAndApplyType {}
  interface uploadConfigInterface extends uploadConfigType {}
  interface savedNamesInterface extends savedNamesType {}
  interface updateConfigInterface extends updateConfig {}
  interface exportConfigInterface extends exportConfig {}
  interface replaceParamsInterface extends replaceParams {}
  interface deleteConfigInterface extends deleteConfig {}
  interface updatePresetInterface extends updatePreset {}
  interface deletePresetInterface extends deletePreset {}
  interface createPresetInterface extends createPreset {}
  interface uploadAvatarConfigInterface extends uploadAvatarConfig {}
  interface loadAvatarConfigInterface extends loadAvatarConfig {}
  interface getAllAvatarsInterface extends getAllAvatars {}
  interface deleteAvatarInterface extends deleteAvatarType {}
  interface exportAvatarInterface extends exportAvatarType {}
  interface updateAvatarDataInterface extends updateAvatarData {}
  interface valuedParamsInterface extends valuedParams {}
  interface applyFromSavedInterface extends applyFromSaved {}
  interface exportedFileCountInterface extends exportedFileCount {}
}

export {}
