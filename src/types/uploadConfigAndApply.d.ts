interface uploadConfigAndApplyType {
  upload: boolean
  save?: boolean
  saveMessage?: string
}

declare global {
  interface uploadConfigAndApplyTypeInterface extends uploadConfigAndApplyType {}
}

export {}
