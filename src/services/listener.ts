import { BrowserWindow } from 'electron'
import { Server } from 'node-osc'
import { avatarConfig } from './avatarConfig'

export function oscListener(OSC_SERVER: Server, mainWindow: BrowserWindow): void {
  OSC_SERVER.on('message', (data) => {
    if (mainWindow) {
      if (data[0] === '/avatar/change') {
        mainWindow.webContents.send('avatarId', { id: data[1] })
        avatarConfig(data[1], mainWindow)
      }
    }
  })
}
