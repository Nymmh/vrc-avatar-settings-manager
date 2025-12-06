import { BrowserWindow, dialog } from 'electron'

export async function showDialogNoSound(
  buttons: string[],
  defaultId: number | 0,
  title: string,
  message: string,
  mainWindow: BrowserWindow
): Promise<Electron.MessageBoxReturnValue> {
  return await dialog.showMessageBox(mainWindow, {
    type: 'none',
    buttons,
    defaultId,
    title,
    message
  })
}
