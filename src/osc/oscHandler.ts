import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { avatarConfig } from '../services/avatarConfig'
import { getNames } from '../database/getSavedNames'
import { applyPreset } from '../database/applyPreset'
import { updatePreset } from '../database/updatePreset'
import { ASMStorage } from '../main/ASMStorage'
import { clearNonExcludedFromCache, isExcluded } from '../helpers/excludedParameters'

export class OSCHandler {
  private readonly PARAM_PREFIX = '/avatar/parameters/'
  private readonly PRESET_TOKEN = 'Nymh/ASM/Preset/'
  private parameterCount: number = 0
  private lastResetTime: number = Date.now()
  private rateInterval: NodeJS.Timeout
  private changeInProgress: boolean = false
  private lastOscAddress: string | null = null
  private lastOscPayload: unknown = undefined
  private lastOscMessageAt: number = 0
  private lastAviChangeId: string | null = null
  private lastAviChangeAt: number = 0
  private lastPresetAddress: string | null = null
  private lastPresetAt: number = 0
  private readonly OSC_MSG_DUP_MS = 50
  private readonly AVI_CHANGE_DUP_MS = 2000
  private readonly PRESET_DUP_MS = 500

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

    if (typeof address !== 'string') {
      this.log.warn('Received malformed OSC address')
      return
    }

    if (isExcluded(address)) return

    if (address === '/avatar/change') {
      if (typeof payload !== 'string') {
        this.log.warn('Avatar change payload is not a string, malformed data')
        return
      }

      await this.handleAvatarChangeTrigger(payload)
    } else if (address.includes(this.PRESET_TOKEN)) {
      await this.handlePresets(address)
    } else if (address.includes(this.PARAM_PREFIX)) {
      if (this.skipDupOsc(address, payload)) {
        return
      }

      this.handleParamChange(address, payload)
    }
  }

  private skipDupOsc(address: string, payload: unknown): boolean {
    const now = Date.now()
    const deltaMs = now - this.lastOscMessageAt
    const isDup =
      this.lastOscAddress === address &&
      Object.is(this.lastOscPayload, payload) &&
      deltaMs >= 0 &&
      deltaMs <= this.OSC_MSG_DUP_MS

    this.lastOscAddress = address
    this.lastOscPayload = payload
    this.lastOscMessageAt = now

    return isDup
  }

  public async handleAvatarChangeTrigger(avatarId: string): Promise<void> {
    if (this.changeInProgress) {
      this.log.warn('Avatar change already in progress, ignoring...')
      return
    }

    const now = Date.now()
    const deltaMs = now - this.lastAviChangeAt
    const isDupAviChange =
      this.lastAviChangeId === avatarId && deltaMs >= 0 && deltaMs < this.AVI_CHANGE_DUP_MS

    if (isDupAviChange) {
      this.log.info(`Duplicate avatar change ignoring... (deltaMs=${deltaMs}): ${avatarId}`)
      return
    }

    clearNonExcludedFromCache()

    this.lastAviChangeId = avatarId
    this.lastAviChangeAt = now
    this.changeInProgress = true

    try {
      await this.handleAvatarChange(avatarId)
    } finally {
      this.changeInProgress = false
    }
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
    if (this.storage.getPendingState()) {
      this.log.warn('Preset change already in progress, ignoring...')
      return
    }

    const now = Date.now()
    const deltaMs = now - this.lastPresetAt
    const isDupPreset =
      this.lastPresetAddress === address && deltaMs >= 0 && deltaMs < this.PRESET_DUP_MS

    if (isDupPreset) {
      this.log.info(`Duplicate preset request ignoring... (deltaMs=${deltaMs}): ${address}`)
      return
    }

    this.lastPresetAddress = address
    this.lastPresetAt = now

    try {
      this.storage.setPendingState(true)
      const presetId = this.getPresetId(address)
      if (presetId === null) {
        this.log.warn('Invalid preset address format:', address)
        return
      }

      const currentAvatarId = this.storage.getCurrentAvatarId()

      if (address.includes('Apply')) {
        await applyPreset(
          this.log,
          this.mainWindow,
          this.avatarDB,
          currentAvatarId,
          presetId,
          this.oscClient,
          false
        )
      } else if (address.includes('Update')) {
        await updatePreset(
          this.log,
          this.avatarDB,
          presetId,
          currentAvatarId,
          this.storage.getPendingChanges(),
          this.mainWindow
        )

        await avatarConfig(this.avatarDB, currentAvatarId, this.mainWindow, new Map(), this.log)
        getNames(this.log, this.avatarDB, this.mainWindow, currentAvatarId)
      } else {
        this.log.warn('Unknown preset address:', address)
      }
    } finally {
      this.storage.setPendingState(false)
    }
  }

  private getPresetId(address: string): number | null {
    const tokenIdx = address.indexOf(this.PRESET_TOKEN)
    if (tokenIdx === -1) {
      return null
    }

    const startIdx = tokenIdx + this.PRESET_TOKEN.length
    const endIdx = address.indexOf('/', startIdx)
    if (endIdx === -1) {
      return null
    }

    const presetId = Number.parseInt(address.slice(startIdx, endIdx), 10)
    if (Number.isNaN(presetId)) {
      return null
    }

    return presetId
  }

  private handleParamChange(address: string, payload: unknown): void {
    const cleanAddress = address.slice(this.PARAM_PREFIX.length)
    this.storage.setPendingChanges(cleanAddress, payload)
    this.parameterCount++
  }
}
