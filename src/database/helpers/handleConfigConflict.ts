import { Database } from 'better-sqlite3'
import { BrowserWindow } from 'electron'
import { showWarning } from '../../services/showWarning'
import { generateUniqueUqid } from './generateUniqueUqid'
import { getNextDuplicateNumber } from './getNextDuplicateNumber'

interface ConfigResult {
  continue: boolean
  config: avatarDBInterface
}

export async function handleConfigConflict(
  db: Database,
  config: avatarDBInterface,
  mainWindow: BrowserWindow
): Promise<ConfigResult> {
  const existingConfig = db
    .prepare(`SELECT id, name FROM avatars WHERE uqid = ? LIMIT 1`)
    .get(config.uqid) as { id: number; name: string } | undefined

  if (existingConfig?.id) {
    const userResponse = await showWarning(
      ['Yes', 'No', 'Cancel Upload'],
      0,
      'Overwrite Warning',
      `A config with the same ID already exists. Do you want to overwrite it?`,
      mainWindow
    )

    if (userResponse.response === 2) {
      return { continue: false, config }
    } else if (userResponse.response === 1) {
      config.uqid = await generateUniqueUqid(db)

      if (config.presets?.forUqid) {
        config.presets.forUqid = config.uqid
      }
    }
  }

  if (existingConfig?.name === config.name) {
    const dup = getNextDuplicateNumber(db, config.name || 'Unknown')
    config.name = `${config.name} (${dup})`
  }

  return { continue: true, config }
}
