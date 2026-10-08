import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import { isVRChatRunning } from '../helpers/isVRChatRunning'
import { ASMStorage } from './ASMStorage'
import { VRChatLogMonitor } from '../file/getVRChatLog'
import { OSCHandler } from '../osc/oscHandler'
import type { OSCStartupStatus } from '../types/osc'

export class VRChatMonitor {
  private isRunning: boolean = false
  private vrchatCheckSkipped: boolean = false
  private checkInterval: NodeJS.Timeout | null = null
  private avatarPollingInterval: NodeJS.Timeout | null = null
  private isCheckingStatus: boolean = false
  private isCheckingAvatarId: boolean = false
  private avatarPollingGeneration: number = 0
  private oscConnectedAt: number | null = null
  private oscWaitTimeout: NodeJS.Timeout | null = null
  private connectionAttempt: number = 0
  private readonly POLL_INTERVAL = 5000 // 5 seconds
  private readonly OSC_WAIT_TIMEOUT = 15000

  constructor(
    private log: Logger,
    private mainWindow: BrowserWindow,
    private storage: ASMStorage,
    private vrchatLog: VRChatLogMonitor,
    private oscHandler: OSCHandler,
    private reportOSCStatus: (status: OSCStartupStatus) => void
  ) {}

  async start(): Promise<void> {
    this.log.info('Starting VRChat monitor...')

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    this.isRunning = await isVRChatRunning()
    this.log.info(`Initial VRChat status: ${this.isRunning ? 'running' : 'not running'}`)

    if (this.isRunning) {
      this.waitForOSC()
      this.vrchatLog.start()
    } else {
      this.reportWaitingForVRChat()
    }

    this.mainWindow.webContents.send('vrchat-status-changed', { isRunning: this.isRunning })
    this.checkInterval = setInterval(() => {
      void this.checkStatus()
    }, this.POLL_INTERVAL)
  }

  private async checkStatus(): Promise<void> {
    if (this.isCheckingStatus || this.vrchatCheckSkipped) {
      return
    }

    this.isCheckingStatus = true

    try {
      const currentStatus = await isVRChatRunning()
      if (this.vrchatCheckSkipped || this.isRunning === currentStatus) return

      this.isRunning = currentStatus

      if (currentStatus) {
        this.log.info('VRChat started')
        this.waitForOSC()
        this.vrchatLog.start()
      } else {
        this.log.info('VRChat closed - cleaning up data')
        this.stopAvatarIdPolling()
        this.clearOSCWait()
        this.oscConnectedAt = null
        this.storage.cleanState()
        this.vrchatLog.stop()
        this.reportWaitingForVRChat()
      }

      this.mainWindow.webContents.send('vrchat-status-changed', { isRunning: currentStatus })
    } catch (error) {
      this.log.error('Error checking VRChat status:', error)
    } finally {
      this.isCheckingStatus = false
    }
  }

  stop(): void {
    this.isRunning = false
    this.vrchatCheckSkipped = false
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    this.stopAvatarIdPolling()
    this.clearOSCWait()
    this.oscConnectedAt = null
    this.vrchatLog.stop()
    this.log.info('VRChat monitor stopped')
  }

  getStatus(): boolean {
    return this.isRunning
  }

  skipVRChatCheck(): boolean {
    if (this.isRunning || !this.checkInterval) return false

    this.vrchatCheckSkipped = true
    this.isRunning = true
    this.log.info('VRChat check skipped by user. Assuming VRChat is running until the app closes.')
    this.waitForOSC()
    this.vrchatLog.start()

    return true
  }

  private clearOSCWait(): void {
    if (this.oscWaitTimeout) clearTimeout(this.oscWaitTimeout)
    this.oscWaitTimeout = null
  }

  private reportWaitingForVRChat(): void {
    this.reportOSCStatus({
      state: 'waiting-vrchat',
      attempt: this.connectionAttempt,
      message: 'Waiting for VRChat...'
    })
  }

  private waitForOSC(): void {
    this.clearOSCWait()
    this.oscConnectedAt = null
    this.connectionAttempt++
    this.reportOSCStatus({
      state: 'waiting-osc',
      attempt: this.connectionAttempt,
      vrchatCheckSkipped: this.vrchatCheckSkipped,
      message: this.vrchatCheckSkipped
        ? 'Waiting for an OSC response...'
        : 'VRChat is running.\nWaiting for an OSC response...'
    })

    this.oscWaitTimeout = setTimeout(() => {
      this.oscWaitTimeout = null
      this.reportOSCStatus({
        state: 'failed',
        attempt: this.connectionAttempt,
        vrchatCheckSkipped: this.vrchatCheckSkipped,
        message:
          'No OSC response received.\nEnable OSC in VRChat under Options > OSC.\nStill waiting for OSC...'
      })
    }, this.OSC_WAIT_TIMEOUT)
  }

  async handleOSCMessage(data: unknown[]): Promise<void> {
    if (!this.isRunning || !Array.isArray(data)) return
    if (this.oscConnectedAt === null) {
      const [address, payload] = data
      const isAvatarChange =
        address === '/avatar/change' &&
        typeof payload === 'string' &&
        /^avtr_[a-zA-Z0-9_-]+$/.test(payload)

      const isParameter =
        typeof address === 'string' &&
        address.startsWith('/avatar/parameters/') &&
        address.length > '/avatar/parameters/'.length &&
        (typeof payload === 'boolean' ||
          typeof payload === 'string' ||
          (typeof payload === 'number' && Number.isFinite(payload)))

      if (!isAvatarChange && !isParameter) return

      this.oscConnectedAt = Date.now()
      this.clearOSCWait()
      this.reportOSCStatus({
        state: 'ready',
        attempt: this.connectionAttempt,
        message: 'Receiving OSC from VRChat.'
      })
    }

    await this.oscHandler.handleMessage(data)
    if (this.isRunning && !this.storage.hasOscAvatarId()) this.startAvatarIdPolling()
  }

  public onNewLogFileFound(): void {
    if (!this.isRunning) {
      return
    }

    const logCreatedAt = this.vrchatLog.getCurrentLog()?.createdAt
    if (logCreatedAt && !this.storage.hasOscAvatarId(logCreatedAt.getTime())) {
      this.storage.cleanState()
      if (this.oscConnectedAt !== null && this.oscConnectedAt < logCreatedAt.getTime()) {
        this.waitForOSC()
      }
    }

    this.log.info('New VRChat log detected, restarting avatar ID polling')
    this.stopAvatarIdPolling()
    if (this.oscConnectedAt !== null) this.startAvatarIdPolling()
  }

  private startAvatarIdPolling(): void {
    if (this.avatarPollingInterval) {
      return
    }

    this.log.info('Starting avatar ID polling...')
    this.avatarPollingInterval = setInterval(() => {
      void this.checkAvatarIdFromLog()
    }, this.POLL_INTERVAL)
    void this.checkAvatarIdFromLog()
  }

  private stopAvatarIdPolling(): void {
    this.avatarPollingGeneration++
    if (this.avatarPollingInterval) {
      clearInterval(this.avatarPollingInterval)
      this.avatarPollingInterval = null
      this.log.info('Stopped avatar ID polling')
    }
  }

  private async checkAvatarIdFromLog(): Promise<void> {
    if (this.isCheckingAvatarId || !this.isRunning || this.oscConnectedAt === null) {
      return
    }

    if (this.storage.hasOscAvatarId()) {
      this.stopAvatarIdPolling()
      return
    }

    this.isCheckingAvatarId = true
    const generation = this.avatarPollingGeneration

    try {
      const avatarId =
        (await this.vrchatLog.getAvatarIdFromOscQuery()) ??
        (await this.vrchatLog.getAvatarIdFromLog())

      if (!this.isRunning || generation !== this.avatarPollingGeneration) {
        return
      }

      if (this.storage.hasOscAvatarId()) {
        this.stopAvatarIdPolling()
        return
      }

      if (!avatarId) {
        return
      }

      if (this.storage.getCurrentAvatarId() !== avatarId) {
        this.log.info(`Recovered avatar ID: ${avatarId}`)
        await this.oscHandler.handleAvatarChangeTrigger(avatarId)
      }

      if (generation === this.avatarPollingGeneration && this.storage.hasOscAvatarId()) {
        this.log.info('Avatar polling stopping')
        this.stopAvatarIdPolling()
      }
    } catch (error) {
      this.log.error('Error checking avatar ID from log:', error)
    } finally {
      this.isCheckingAvatarId = false
    }
  }
}
