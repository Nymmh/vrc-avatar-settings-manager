import { app, dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import { exportAllForUpdate } from '../file/exportAllForUpdate'

export async function update(log: Logger, avatarDB: Database): Promise<void> {
  if (!app.isPackaged) {
    log.info('App is not packaged. Skipping update check.')
    return
  }

  autoUpdater.logger = log
  autoUpdater.allowPrerelease = false
  autoUpdater.autoDownload = true

  autoUpdater.on('error', (e) => {
    const errorMessage = e == null ? 'unknown' : (e.stack || e).toString()
    log.info('Update error:', errorMessage)
    dialog.showErrorBox('Error ', errorMessage)
  })

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
  })

  autoUpdater.on('update-available', () => {
    log.info('Update available')
  })

  autoUpdater.on('update-not-available', () => {
    log.info('No update available')
  })

  autoUpdater.on('update-downloaded', async (info: UpdateInfo) => {
    log.info(`Update downloaded: Version ${info.version}`)

    const result = await dialog.showMessageBox({
      type: 'question',
      title: 'Update Available',
      message: `Would you like to install version ${info.version} now?`,
      buttons: ['Yes', 'Later']
    })

    if (result.response === 0) {
      log.info('App closing and installing update...')
      try {
        await exportAllForUpdate(log, avatarDB)
      } finally {
        autoUpdater.quitAndInstall()
      }
    } else {
      log.info('User chose to install the update later')
    }
  })

  autoUpdater.checkForUpdates()
}
