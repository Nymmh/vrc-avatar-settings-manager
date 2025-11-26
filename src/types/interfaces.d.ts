interface avatarConfig {
  type?: string
  id?: string
  avatarId?: string
  uqid?: string
  name?: string
  nsfw?: boolean
  animationParameters?: animationParameters[]
  parameters?: avatarConfigParams[]
  fromFile?: number
  isPreset?: number
  presets?: presetDBInterface
}

interface loadAvatarConfigFile {
  type: string
  avatarId: string
  name: string
  configs: avatarConfig[]
}

interface avatarConfigParams {
  name?: string
  input?: {
    address?: string
    type?: string
  }
  output?: {
    address?: string
    type?: string
  }
}

interface animationParameters {
  name?: string
  value?: number | boolean
  type?: string
}

interface avatarDB {
  id: number
  avatarId: string
  uqid: string
  name: string
  avatarName: string
  nsfw: number
  parameters: string
  fromFile: number
  isPreset: number
  presets?: presetDBInterface
}

interface avatarStorageDB {
  id: number
  avatarId: string
  name: string
}

interface applyFromSaved {
  avatarId: string
  nsfw: number
  parameters: string
}

interface exportConfig {
  success: boolean
  message?: string
}

interface getAllSaved {
  id: number
  uqid: string
  avatarId: string
  name: string
  avatarName: string
  nsfw: number
  fromFile: number
  isPreset: number
}

interface getAllPresets {
  id: number
  forUqid: string
  avatarId: string
  name: string
  unityParameter: number
}

interface updateConfig {
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

interface updateParams {
  success: boolean
  message?: string
}

interface uploadConfigType {
  upload: boolean
  saveMessage?: string
}

interface uploadConfigAndApplyType {
  upload: boolean
  save?: boolean
  saveMessage?: string
}

interface replaceParamsType {
  success: boolean
  message?: string
}

interface deleteConfigType {
  success: boolean
  message?: string
}

interface saveUpdateType {
  success: boolean
  message?: string
}

interface savedNamesType {
  id: number
  name: string
}

interface createPreset {
  success: boolean
  message?: string
}

interface uploadAvatarConfig {
  success: boolean
  message?: string
}

interface presetDB {
  forUqid: string
  avatarId: string
  name: string
  unityParameter: number
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

declare global {
  interface avatarConfigInterface extends avatarConfig {}
  interface avatarConfigParamsInterface extends avatarConfigParams {}
  interface animationParametersInterface extends animationParameters {}
  interface avatarDBInterface extends avatarDB {}
  interface applyFromSavedInterface extends applyFromSaved {}
  interface exportConfigInterface extends exportConfig {}
  interface getAllSavedInterface extends getAllSaved {}
  interface updateConfigInterface extends updateConfig {}
  interface updateParamsInterface extends updateParams {}
  interface uploadConfigInterface extends uploadConfigType {}
  interface uploadConfigAndApplyTypeInterface extends uploadConfigAndApplyType {}
  interface replaceParamsInterface extends replaceParamsType {}
  interface deleteConfigInterface extends deleteConfigType {}
  interface saveUpdateInterface extends saveUpdateType {}
  interface savedNamesInterface extends savedNamesType {}
  interface getAllPresetsInterface extends getAllPresets {}
  interface updatePresetInterface extends updatePreset {}
  interface deletePresetInterface extends deletePreset {}
  interface createPresetInterface extends createPreset {}
  interface presetDBInterface extends presetDB {}
  interface uploadAvatarConfigInterface extends uploadAvatarConfig {}
  interface loadAvatarConfigInterface extends loadAvatarConfig {}
  interface loadAvatarConfigFileInterface extends loadAvatarConfigFile {}
  interface getAllAvatarsInterface extends getAllAvatars {}
  interface deleteAvatarInterface extends deleteAvatarType {}
  interface exportAvatarInterface extends exportAvatarType {}
  interface avatarStorageDBInterface extends avatarStorageDB {}
  interface updateAvatarDataInterface extends updateAvatarData {}
}

export {}
