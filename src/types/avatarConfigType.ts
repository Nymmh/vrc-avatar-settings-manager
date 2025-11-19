export type avatarConfigType = {
  id: string
  name: string
  animationParameters?: animationParametersType[]
  parameters?: avatarConfigParamsType[]
}

export type animationParametersType = {
  name?: string
  value?: number | boolean
  type?: string
}

export type pendingChangesType = [name?: string, value?: number][]

export type avatarCacheType = {
  animationParameters: animationParametersType
}

export type avatarConfigParamsType = {
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
