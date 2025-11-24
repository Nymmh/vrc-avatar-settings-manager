interface avatarConfig {
  id?: string
  uqid?: string
  name?: string
  nsfw?: boolean
  animationParameters?: animationParameters[]
  parameters?: avatarConfigParams[]
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
  avatarId: string
  name: string
  avatarName: string
  nsfw: number
  fromFile: number
}

interface updateConfig {
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
}

export {}
