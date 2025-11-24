import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { applyConfig } from '../services/applyConfig'

export async function applyPreset(
  log: Logger,
  db: Database,
  avatarId: string,
  presetId: number,
  OSC_CLIENT: Client
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
      .get(avatarId, `/Preset/${presetId}/Apply`) as { forUqid: string } | undefined

    if (!preset) {
      log.error('No preset found')
      return false
    }

    const avatarData = db
      .prepare(
        `
      SELECT parameters FROM avatars
      WHERE uqid = ?
      LIMIT 1
    `
      )
      .get(preset.forUqid) as { parameters: string } | undefined

    if (!avatarData) {
      log.error('No avatar config found')
      return false
    }

    const parameters = JSON.parse(avatarData.parameters)

    return await applyConfig(log, parameters, OSC_CLIENT)
  } catch (e) {
    log.error('Error applying preset:', e)
    return false
  }
}
