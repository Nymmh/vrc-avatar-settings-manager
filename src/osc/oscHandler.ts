import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { avatarConfig } from '../services/avatarConfig'
import { getNames } from '../database/getSavedNames'
import { applyPreset } from '../database/applyPreset'
import { updatePreset } from '../database/updatePreset'
import { ASMStorage } from '../main/ASMStorage'

export class OSCHandler {
  constructor(
    private log: Logger,
    private mainWindow: BrowserWindow,
    private avatarDB: Database,
    private oscClient: Client,
    private storage: ASMStorage
  ) {}

  async handleMessage(data: unknown[]): Promise<void> {
    if (!data || data.length === 0) {
      this.log.warn('Received malformed OSC message')
      return
    }

    const [address, payload] = data as [string, unknown]

    if (
      /\/LastSynced$/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]SyncData/.test(address) ||
      /^FT\/v2\//.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]SyncPointer$/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]TC_current/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]TC_FullControllerBuilder/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]TC_merged_trackingEyes$/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]TC_VRC[ _]Avatar[ _]Descriptor_trackingEyes$/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]timeSinceLoad$/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]counter$/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]ScaleFactor_b$/.test(address) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]ScaleFactorDiff$/.test(address) ||
      /^VF[ _]\d+(?:\.\d+)*$/.test(address) ||
      /^VF_\d+(?:\.\d+)*[a-z]/.test(address) ||
      /^VF_\d+(?:\.\d+)*_One$/.test(address) ||
      /^VF_\d+(?:\.\d+)*_True$/.test(address) ||
      /^VFH\/Version/.test(address)
    )
      return

    if (address === '/avatar/change') {
      await this.handleAvatarChange(payload as string)
    } else if (address.includes('Nymh/ASM/Preset/')) {
      await this.handlePresets(address)
    } else if (address.includes('/avatar/parameters/')) {
      this.handleParamChange(address, payload)
    }
  }

  private async handleAvatarChange(avatarId: string): Promise<void> {
    this.log.info('Received avatar change')

    this.storage.clearPendingChanges()
    this.storage.clearLoadedJson()
    this.storage.setCurrentAvatarId(avatarId)
    this.mainWindow.webContents.send('avatarId', { id: avatarId })

    await avatarConfig(avatarId, this.mainWindow, new Map())
    getNames(this.log, this.avatarDB, this.mainWindow, avatarId)
  }

  private async handlePresets(address: string): Promise<void> {
    if (this.storage.getPendingState()) return
    this.storage.setPendingState(true)
    const cleanAddress = address.replace('/avatar/parameters/', '')
    const match = cleanAddress.match(/\/(\d+)\//)

    if (!match) {
      this.log.warn('Invalid preset address format: ', address)
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

      await avatarConfig(this.storage.getCurrentAvatarId(), this.mainWindow, new Map())
      this.storage.setPendingState(false)
      getNames(this.log, this.avatarDB, this.mainWindow, this.storage.getCurrentAvatarId())
    } else {
      this.log.warn('Unknown preset address: ', address)
      this.storage.setPendingState(false)
    }
  }

  private handleParamChange(address: string, payload: unknown): void {
    const cleanAddress = address.replace('/avatar/parameters/', '')
    this.storage.setPendingChanges(cleanAddress, payload)
  }
}
