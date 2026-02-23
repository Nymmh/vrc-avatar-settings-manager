import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { avatarConfig } from '../services/avatarConfig'
import { getNames } from '../database/getSavedNames'
import { applyPreset } from '../database/applyPreset'
import { updatePreset } from '../database/updatePreset'
import { ASMStorage } from '../main/ASMStorage'
import { isExcluded } from '../helpers/excludedParameters'

export class OSCHandler {
  private parameterCount: number = 0
  private lastResetTime: number = Date.now()
  private rateInterval: NodeJS.Timeout
  private changeInProgress: boolean = false
  private lastOscMessageKey: string | null = null
  private lastOscMessageAt: number = 0
  private lastAviChangeId: string | null = null
  private lastAviChangeAt: number = 0
  private readonly OSC_MSG_DUP_MS = 50
  private readonly AVI_CHANGE_DUP_MS = 2000

  constructor(
    private log: Logger,
    private mainWindow: BrowserWindow,
    private avatarDB: Database,
    private oscClient: Client,
    private storage: ASMStorage
  ) {
    this.rateInterval = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - this.lastResetTime) / 1000
      const rate = Math.round(this.parameterCount / elapsed)

      if (this.parameterCount > 0) {
        this.mainWindow.webContents.send('parameterRateUpdate', `${rate} params/sec`)
      }

      this.parameterCount = 0
      this.lastResetTime = now
    }, 1000)
  }

  cleanup(): void {
    clearInterval(this.rateInterval)
  }

  async handleMessage(data: unknown[]): Promise<void> {
    if (!data || data.length === 0) {
      this.log.warn('Received malformed OSC message')
      return
    }

    const [address, payload] = data as [string, unknown]

    if (isExcluded(address)) return

    if (address === '/avatar/change') {
      if (typeof payload !== 'string') {
        this.log.warn('Avatar change payload is not a string, malformed data')
        return
      }

      await this.handleAvatarChangeTrigger(payload)
    } else if (address.includes('Nymh/ASM/Preset/')) {
      await this.handlePresets(address)
    } else if (address.includes('/avatar/parameters/')) {
      if (this.skipDupOsc(address, payload)) {
        return
      }

      this.handleParamChange(address, payload)
    }
  }

  private skipDupOsc(address: string, payload: unknown): boolean {
    const now = Date.now()
    const payloadKey = this.getPayloadKey(payload)
    const messageKey = `${address}|${payloadKey}`
    const deltaMs = now - this.lastOscMessageAt
    const isDup =
      this.lastOscMessageKey === messageKey && deltaMs >= 0 && deltaMs <= this.OSC_MSG_DUP_MS

    this.lastOscMessageKey = messageKey
    this.lastOscMessageAt = now

    return isDup
  }

  private getPayloadKey(payload: unknown): string {
    return String(payload)
  }

  public async handleAvatarChangeTrigger(avatarId: string): Promise<void> {
    const deltaMs = Date.now() - this.lastAviChangeAt

    if (this.ignoreDupAviChange(avatarId)) {
      this.log.info(`Duplicate avatar change ignoring (deltaMs=${deltaMs}): ${avatarId}`)
      return
    }

    if (this.changeInProgress) {
      this.log.warn('Avatar change already in progress, ignoring...')
      return
    }

    this.lastAviChangeId = avatarId
    this.lastAviChangeAt = Date.now()
    this.changeInProgress = true

    try {
      await this.handleAvatarChange(avatarId)
    } finally {
      this.changeInProgress = false
    }
  }

  private ignoreDupAviChange(avatarId: string): boolean {
    return (
      this.lastAviChangeId === avatarId &&
      Date.now() - this.lastAviChangeAt < this.AVI_CHANGE_DUP_MS
    )
  }

  private async handleAvatarChange(avatarId: string): Promise<void> {
    this.log.info('Received avatar change')

    this.storage.clearPendingChanges()
    this.storage.clearLoadedJson()
    this.storage.setCurrentAvatarId(avatarId)
    this.mainWindow.webContents.send('avatarId', { id: avatarId })

    await avatarConfig(this.avatarDB, avatarId, this.mainWindow, new Map(), this.log)
    getNames(this.log, this.avatarDB, this.mainWindow, avatarId)
  }

  private async handlePresets(address: string): Promise<void> {
    try {
      if (this.storage.getPendingState()) return
      this.storage.setPendingState(true)
      const cleanAddress = address.replace('/avatar/parameters/', '')
      const match = cleanAddress.match(/\/(\d+)\//)

      if (!match) {
        this.log.warn('Invalid preset address format:', address)
        return
      }

      const presetId = parseInt(match[1], 10)

      if (address.includes('Apply')) {
        await applyPreset(
          this.log,
          this.mainWindow,
          this.avatarDB,
          this.storage.getCurrentAvatarId(),
          presetId,
          this.oscClient,
          false
        )

        this.storage.setPendingState(false)
      } else if (address.includes('Update')) {
        await updatePreset(
          this.log,
          this.avatarDB,
          presetId,
          this.storage.getCurrentAvatarId(),
          this.storage.getPendingChanges(),
          this.mainWindow
        )

        await avatarConfig(
          this.avatarDB,
          this.storage.getCurrentAvatarId(),
          this.mainWindow,
          new Map(),
          this.log
        )
        getNames(this.log, this.avatarDB, this.mainWindow, this.storage.getCurrentAvatarId())
      } else {
        this.log.warn('Unknown preset address:', address)
      }
    } finally {
      this.storage.setPendingState(false)
    }
  }

  private handleParamChange(address: string, payload: unknown): void {
    const cleanAddress = address.replace('/avatar/parameters/', '')
    this.storage.setPendingChanges(cleanAddress, payload)
    this.parameterCount++
  }
}
