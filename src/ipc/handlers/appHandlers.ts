import { ipcMain, app } from 'electron'

export function appHandlers(): void {
  ipcMain.handle('appVersion', () => {
    return app.getVersion()
  })
}
