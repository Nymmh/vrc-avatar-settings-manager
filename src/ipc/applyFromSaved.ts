import { Logger } from 'electron-log'
import { BrowserWindow } from 'electron'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { applyConfig } from '../services/applyConfig'
import { showWarning } from '../services/showWarning'

export async function applyFromSaved(
  log: Logger,
  db: Database,
  name: string,
  currentAvatarId: string,
  OSC_CLIENT: Client,
  mainWindow: BrowserWindow
): Promise<boolean> {
  try {
    log.info(`Applying config from saved: ${name}`)

    const q = db.prepare('SELECT avatarId,nsfw,parameters FROM avatars WHERE name = ?')
    const row = (await q.get(name)) as applyFromSavedInterface | undefined

    if (!row) {
      log.error(`No saved config found with the name: ${name}`)
      return false
    }

    const warningButtons = ['Apply', 'Cancel']

    if (row.avatarId !== currentAvatarId) {
      const userResponse = await showWarning(
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

    if (row.nsfw) {
      const userResponse = await showWarning(
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

    const parameters: animationParametersInterface[] = JSON.parse(row.parameters)

    return await applyConfig(log, parameters, OSC_CLIENT)
  } catch (e) {
    log.error('Error applying config from saved:', e)
    return false
  }
}
