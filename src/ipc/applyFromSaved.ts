import { Logger } from 'electron-log'
import { BrowserWindow } from 'electron'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { applyConfig } from '../services/applyConfig'
import { showDialogNoSound } from '../services/showDialogNoSound'

export async function applyFromSaved(
  log: Logger,
  db: Database,
  id: number,
  currentAvatarId: string,
  OSC_CLIENT: Client,
  mainWindow: BrowserWindow
): Promise<boolean> {
  try {
    log.info(`Applying config: ${id}`)

    const q = db
      .prepare('SELECT avatarId,nsfw,parameters FROM avatars WHERE id = ? LIMIT 1')
      .get(id) as applyFromSavedInterface | undefined

    if (!q) {
      log.info(`Config not found: ${id}`)
      return false
    }

    let parameters: valuedParamsInterface[]

    try {
      parameters = JSON.parse(q.parameters)
    } catch {
      log.info('Error parsing JSON:')
      return false
    }

    const warningButtons = ['Apply', 'Cancel']

    if (q.avatarId !== currentAvatarId) {
      const userResponse = await showDialogNoSound(
        warningButtons,
        0,
        'Avatar Mismatch',
        `The avatar ID's do not match. Applying this configuration may lead to unexpected results. Do you want to proceed?`,
        mainWindow
      )

      if (userResponse.response !== 0) {
        return false
      }
    }

    if (q.nsfw) {
      const userResponse = await showDialogNoSound(
        warningButtons,
        0,
        'NSFW',
        `This config is marked as NSFW. Do you want to proceed?`,
        mainWindow
      )

      if (userResponse.response !== 0) {
        return false
      }
    }

    return await applyConfig(log, parameters, OSC_CLIENT)
  } catch (e) {
    log.info('Error applying config from saved:', e)
    return false
  }
}
