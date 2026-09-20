const MAX_PENDING_CHANGES = 8192
const MAX_PARAMETER_NAME_LENGTH = 1024
const MAX_PARAMETER_STRING_LENGTH = 1024

export class ASMStorage {
  private currentAviId: string = ''
  private avatarIdConfirmedByOscAt: number | null = null
  private loadedJson: avatarDBInterface | null = null
  private pendingChanges: Map<string, unknown> = new Map()
  private loadedAvatarJson: exportAllConfigsInterface | null = null
  private pendingState: boolean = false

  getCurrentAvatarId(): string {
    return this.currentAviId
  }

  setCurrentAvatarId(avatarId: string): void {
    this.currentAviId = avatarId
  }

  hasOscAvatarId(since: number = 0): boolean {
    return this.avatarIdConfirmedByOscAt !== null && this.avatarIdConfirmedByOscAt >= since
  }

  confirmAvatarIdFromOsc(): void {
    this.avatarIdConfirmedByOscAt = Date.now()
  }

  getLoadedJson(): avatarDBInterface | null {
    return this.loadedJson
  }

  setLoadedJson(data: avatarDBInterface | null): void {
    this.loadedJson = data
  }
  clearLoadedJson(): void {
    this.loadedJson = null
  }

  getPendingChanges(): Map<string, unknown> {
    return new Map(this.pendingChanges)
  }

  private isValidPendingChange(address: string, payload: unknown): boolean {
    if (
      typeof address !== 'string' ||
      address.length === 0 ||
      address.length > MAX_PARAMETER_NAME_LENGTH
    ) {
      return false
    }

    if (payload === undefined || payload === null || typeof payload === 'boolean') return true
    if (typeof payload === 'number') return Number.isFinite(payload)
    return typeof payload === 'string' && payload.length <= MAX_PARAMETER_STRING_LENGTH
  }

  setPendingChanges(address: string, payload: unknown): boolean {
    if (!this.isValidPendingChange(address, payload)) return false
    if (!this.pendingChanges.has(address) && this.pendingChanges.size >= MAX_PENDING_CHANGES) {
      return false
    }
    this.pendingChanges.set(address, payload)
    return true
  }

  setPendingChangesBulk(changes: Map<string, unknown>): boolean {
    if (changes.size > MAX_PENDING_CHANGES) return false
    for (const [address, payload] of changes) {
      if (!this.isValidPendingChange(address, payload)) return false
    }

    this.pendingChanges = new Map(changes)
    return true
  }

  clearPendingChanges(): void {
    this.pendingChanges.clear()
  }

  getLoadedAvatarJson(): exportAllConfigsInterface | null {
    return this.loadedAvatarJson
  }

  setLoadedAvatarJson(data: exportAllConfigsInterface | null): void {
    this.loadedAvatarJson = data
  }

  getPendingState(): boolean {
    return this.pendingState
  }

  setPendingState(newState: boolean): void {
    this.pendingState = newState
  }

  cleanState(): void {
    this.currentAviId = ''
    this.avatarIdConfirmedByOscAt = null
    this.loadedJson = null
    this.pendingChanges.clear()
    this.loadedAvatarJson = null
    this.pendingState = false
  }
}
