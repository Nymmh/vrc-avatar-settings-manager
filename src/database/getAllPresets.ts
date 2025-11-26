import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function getAllPresets(
  log: Logger,
  db: Database,
  uqid?: string | undefined
): getAllPresetsInterface[] | null {
  try {
    if (uqid) {
      const q = db.prepare(
        'SELECT id,foruqId,avatarId,name,unityParameter FROM presets WHERE foruqId = ? LIMIT 1'
      )
      return q.all(uqid) as getAllPresetsInterface[]
    } else {
      const q = db.prepare('SELECT id,foruqId,avatarId,name,unityParameter FROM presets')
      return q.all() as getAllPresetsInterface[]
    }
  } catch (e) {
    log.error('Error getting all presets:', e)
    return null
  }
}
