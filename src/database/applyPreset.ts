import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { applyConfig } from '../services/applyConfig'
import { BrowserWindow } from 'electron'
import { showDialogNoSound } from '../services/showDialogNoSound'

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
    log.info(`Applying preset ID ${presetId} for avatar ID ${avatarId}`)

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
      log.warn('No preset found')
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
      log.warn('No avatar config found')
      return false
    }

    if (nsfwCheck && avatarData.nsfw) {
      log.info('NSFW avatar detected, waiting user input')
      const userResponse = await showDialogNoSound(
        ['Yes', 'No'],
        0,
        'Avatar ID Mismatch',
        `The avatar ID's do not match. Uploading this configuration may lead to unexpected results. Do you want to proceed?`,
        mainWindow
      )

      if (userResponse.response !== 0) {
        log.info('User cancelled preset application due to NSFW avatar')
        return false
      }
    }

    const parameters = JSON.parse(avatarData.parameters)

    return await applyConfig(log, parameters, OSC_CLIENT)
  } catch (e) {
    log.error('Error applying preset:', e)
    return false
  }
}
