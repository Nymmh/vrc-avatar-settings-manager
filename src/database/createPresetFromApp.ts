import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export async function createPresetFromApp(
  log: Logger,
  mainWindow: BrowserWindow,
  db: Database,
  id: number
): Promise<createPresetInterface> {
  try {
    const avatarData = db.prepare('SELECT uqid,avatarId,name FROM avatars WHERE id = ?').get(id)

    if (!avatarData?.uqid) {
      return { success: false, message: 'Avatar config not found' }
    }

    const presetExisting = db
      .prepare('SELECT id FROM presets WHERE forUqid = ?')
      .get(avatarData.uqid)

    if (presetExisting) {
      return { success: false, message: 'Preset already exists' }
    }

    let saveName = avatarData.name
    let presetNumber = 1

    const allPresetForAvatar = db
      .prepare('SELECT * FROM presets WHERE avatarId = ?')
      .all(avatarData.avatarId)

    if (allPresetForAvatar && allPresetForAvatar.length) {
      presetNumber = allPresetForAvatar.length + 1
    }

    if (!saveName.includes(' Preset ')) {
      saveName += ' Preset ' + presetNumber
    }

    db.prepare(
      `
        UPDATE avatars
        SET isPreset = 1
        WHERE uqid = ?
      `
    ).run(avatarData.uqid)

    db.prepare(
      `
        INSERT INTO presets (forUqid, avatarId, name, unityParameter)
        VALUES (?, ?, ?, ?)
        `
    ).run(avatarData.uqid, avatarData.avatarId, saveName, presetNumber)

    log.info('Preset created from app successfully')
    return { success: true, message: 'Preset created successfully' }
  } catch (e) {
    log.error('Error creating preset from app:', e)
    return { success: false, message: 'Error creating preset' }
  }
}
