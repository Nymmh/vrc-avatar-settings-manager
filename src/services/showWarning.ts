import { BrowserWindow, dialog } from 'electron'

export async function showWarning(
  buttons: string[],
  defaultId: number | 0,
  title: string,
  message: string,
  mainWindow: BrowserWindow
): Promise<Electron.MessageBoxReturnValue> {
  return await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons,
    defaultId,
    title,
    message
  })
}
