import { dialog } from 'electron'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

export async function update(): Promise<void> {
  log.transports.file.level = 'debug'
  autoUpdater.logger = log
  autoUpdater.allowPrerelease = false
  autoUpdater.autoDownload = true

  autoUpdater.on('error', (e) => {
    dialog.showErrorBox('Error ', e == null ? 'unknown' : (e.stack || e).toString())
  })

  autoUpdater.on('update-downloaded', async (info) => {
    const result = await dialog.showMessageBox({
      type: 'question',
      title: 'Update Available',
      message: `Would you like to install version ${info.version} now?`,
      buttons: ['Yes', 'Later']
    })

    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
  })

  autoUpdater.checkForUpdates()
}
