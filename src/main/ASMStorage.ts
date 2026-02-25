export class ASMStorage {
  private currentAviId: string = ''
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
    return this.pendingChanges
  }

  setPendingChanges(address: string, payload: unknown): void {
    this.pendingChanges.set(address, payload)
  }

  setPendingChangesBulk(changes: Map<string, unknown>): void {
    this.pendingChanges.clear()

    for (const [address, payload] of changes) {
      this.pendingChanges.set(address, payload)
    }
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
    this.loadedJson = null
    this.pendingChanges.clear()
    this.loadedAvatarJson = null
    this.pendingState = false
  }
}
