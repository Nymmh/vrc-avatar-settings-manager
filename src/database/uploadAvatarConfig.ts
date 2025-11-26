import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { uploadAvatar } from './uploadAvatar'

export async function uploadAvatarConfig(
  log: Logger,
  db: Database,
  loadedJson: exportAllConfigsInterface
): Promise<uploadAvatarConfigInterface> {
  if (loadedJson && loadedJson.type !== 'avatar') {
    return {
      success: false,
      message: 'Uploaded data is not an avatar type'
    }
  }

  return await uploadAvatar(log, db, loadedJson)
}
