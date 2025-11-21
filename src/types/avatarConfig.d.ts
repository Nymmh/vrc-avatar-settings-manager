interface avatarConfig {
  id: string
  name: string
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

declare global {
  interface avatarConfigInterface extends avatarConfig {}
  interface avatarConfigParamsInterface extends avatarConfigParams {}
  interface animationParametersInterface extends animationParameters {}
}

export {}
