interface avatarDB {
  id: string
  name: string
  nsfw: number
  parameters: string
}

interface applyFromSaved {
  avatarId: string
  nsfw: number
  parameters: string
}

declare global {
  interface avatarDBInterface extends avatarDB {}
  interface applyFromSavedInterface extends applyFromSaved {}
}

export {}
