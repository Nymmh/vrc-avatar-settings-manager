import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { applyConfig } from '../services/applyConfig'
import { showWarning } from '../services/showWarning'
import { BrowserWindow } from 'electron'

export async function applyPreset(
  log: Logger,
  mainWindow: BrowserWindow,
  db: Database,
  avatarId: string,
  presetId: number,
  OSC_CLIENT: Client,
  nsfwCheck: boolean = false
): Promise<boolean> {
  try {
    const preset = db
      .prepare(
        `
      SELECT forUqid FROM presets
      WHERE avatarId = ? AND unityParameter = ?
      LIMIT 1
    `
      )
      .get(avatarId, presetId) as { forUqid: string } | undefined

    if (!preset) {
      log.error('No preset found')
      return false
    }

    const avatarData = db
      .prepare(
        `
      SELECT parameters, nsfw FROM avatars
      WHERE uqid = ?
      LIMIT 1
    `
      )
      .get(preset.forUqid) as { parameters: string; nsfw: boolean } | undefined

    if (!avatarData) {
      log.error('No avatar config found')
      return false
    }

    if (nsfwCheck && avatarData.nsfw) {
      const userResponse = await showWarning(
        ['Yes', 'No'],
        0,
        'Avatar ID Mismatch',
        `The avatar ID's do not match. Uploading this configuration may lead to unexpected results. Do you want to proceed?`,
        mainWindow
      )

      if (userResponse.response !== 0) return false
    }

    const parameters = JSON.parse(avatarData.parameters)

    return await applyConfig(log, parameters, OSC_CLIENT)
  } catch (e) {
    log.error('Error applying preset:', e)
    return false
  }
}
