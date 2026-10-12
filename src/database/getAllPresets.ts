import type { savedPresetInterface } from '../types/ipc'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'

export function getAllPresets(
  log: Logger,
  db: Database,
  uqid?: string
): savedPresetInterface[] | null {
  try {
    if (uqid) {
      const q = db.prepare(
        'SELECT id,forUqid,avatarId,name,unityParameter FROM presets WHERE forUqid = ? LIMIT 1'
      )
      return q.all(uqid) as savedPresetInterface[]
    }

    const q = db.prepare('SELECT id,forUqid,avatarId,name,unityParameter FROM presets')
    return q.all() as savedPresetInterface[]
  } catch (e) {
    log.error('Error getting all presets:', e)
    return null
  }
}
