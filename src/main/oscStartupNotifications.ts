import type { BrowserWindow, IpcMain } from 'electron'
import type { OSCStartupStatus } from '../types/osc'

export function registerOSCStartupNotifications(
  ipc: IpcMain,
  getWindow: () => BrowserWindow | null
): (status: OSCStartupStatus) => void {
  let latest: OSCStartupStatus | undefined

  const send = (): void => {
    const window = getWindow()
    if (!latest || !window || window.isDestroyed() || window.webContents.isDestroyed()) return

    window.webContents.send('osc-startup-status', latest)
  }

  ipc.on('osc-startup-subscribe', (event) => {
    if (event.sender === getWindow()?.webContents) send()
  })

  return (status) => {
    latest = status
    send()
  }
}
