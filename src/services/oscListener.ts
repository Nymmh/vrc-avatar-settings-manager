import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import { Server } from 'node-osc'
import { avatarConfig } from './avatarConfig'

export function oscListener(log: Logger, OSC_SERVER: Server, mainWindow: BrowserWindow): void {
  if (!OSC_SERVER) {
    log.error('OSC Server is not started')
    throw new Error('OSC Server is not started')
  }

  if (!mainWindow) {
    log.error('Main window is not initialized')
    throw new Error('Main window is not initialized')
  }

  log.info('OSC Listener ready')

  OSC_SERVER.on('message', (data) => {
    if (!data || data.length === 0) {
      log.warn('Received malformed OSC message:', data)
      return
    }

    const [address, payload] = data

    if (address === '/avatar/change') {
      log.log('Received avatar change with ID: ', payload)

      mainWindow.webContents.send('avatarId', { id: payload })
      avatarConfig(payload, mainWindow, new Map())
    }
  })
}
