import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import { isVRChatRunning } from '../helpers/isVRChatRunning'
import { ASMStorage } from './ASMStorage'
import { VRChatLogMonitor } from '../file/getVRChatLog'
import { OSCHandler } from '../osc/oscHandler'

export class VRChatMonitor {
  private isRunning: boolean = false
  private checkInterval: NodeJS.Timeout | null = null
  private avatarPollingInterval: NodeJS.Timeout | null = null
  private isCheckingStatus: boolean = false
  private isCheckingAvatarId: boolean = false
  private readonly POLL_INTERVAL = 5000 // 5 seconds

  constructor(
    private log: Logger,
    private mainWindow: BrowserWindow,
    private storage: ASMStorage,
    private vrchatLog: VRChatLogMonitor,
    private oscHandler: OSCHandler
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
      this.vrchatLog.start()
    }

    this.mainWindow.webContents.send('vrchat-status-changed', { isRunning: this.isRunning })
    this.checkInterval = setInterval(() => {
      void this.checkStatus()
    }, this.POLL_INTERVAL)
  }

  private async checkStatus(): Promise<void> {
    if (this.isCheckingStatus) {
      return
    }

    this.isCheckingStatus = true

    try {
      const currentStatus = await isVRChatRunning()

      if (this.isRunning !== currentStatus) {
        this.isRunning = currentStatus

        if (currentStatus) {
          this.log.info('VRChat started')
          this.vrchatLog.start()
          this.mainWindow.webContents.send('vrchat-status-changed', { isRunning: true })
        } else {
          this.log.info('VRChat closed - cleaning up data')
          this.stopAvatarIdPolling()
          this.storage.cleanState()
          this.vrchatLog.stop()
          this.mainWindow.webContents.send('vrchat-status-changed', { isRunning: false })
        }
      }
    } catch (error) {
      this.log.error('Error checking VRChat status:', error)
    } finally {
      this.isCheckingStatus = false
    }
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    this.stopAvatarIdPolling()
    this.vrchatLog.stop()
    this.log.info('VRChat monitor stopped')
  }

  getStatus(): boolean {
    return this.isRunning
  }

  public onNewLogFileFound(): void {
    if (!this.isRunning) {
      return
    }

    this.log.info('New VRChat log detected, restarting avatar ID polling')
    this.stopAvatarIdPolling()
    this.startAvatarIdPolling()
  }

  private startAvatarIdPolling(): void {
    if (this.avatarPollingInterval) {
      return
    }

    this.log.info('Starting avatar ID polling...')
    void this.checkAvatarIdFromLog()

    this.avatarPollingInterval = setInterval(() => {
      void this.checkAvatarIdFromLog()
    }, this.POLL_INTERVAL)
  }

  private stopAvatarIdPolling(): void {
    if (this.avatarPollingInterval) {
      clearInterval(this.avatarPollingInterval)
      this.avatarPollingInterval = null
      this.log.info('Stopped avatar ID polling')
    }
  }

  private async checkAvatarIdFromLog(): Promise<void> {
    if (this.isCheckingAvatarId || !this.isRunning) {
      return
    }

    this.isCheckingAvatarId = true

    try {
      const avatarId = await this.vrchatLog.getAvatarIdFromLog()

      if (!avatarId) {
        return
      }

      if (this.storage.getCurrentAvatarId() === avatarId) {
        this.log.info('Avatar ID from log matches stored avatar ID')
      } else {
        this.log.info(`Avatar ID from log: ${avatarId}`)
        this.storage.setCurrentAvatarId(avatarId)
        await this.oscHandler.handleAvatarChangeTrigger(avatarId)
      }

      this.stopAvatarIdPolling()
    } catch (error) {
      this.log.error('Error checking avatar ID from log:', error)
    } finally {
      this.isCheckingAvatarId = false
    }
  }
}
