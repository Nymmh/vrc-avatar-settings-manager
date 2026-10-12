import { ipcMain } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import type { ipcArgsType, ipcChannelType, ipcResultType } from '../types/ipc'

export function handleIpc<Ch extends ipcChannelType>(
  channel: Ch,
  handler: (
    event: IpcMainInvokeEvent,
    ...args: ipcArgsType<Ch>
  ) => ipcResultType<Ch> | Promise<ipcResultType<Ch>>
): void {
  ipcMain.handle(channel, handler)
}
