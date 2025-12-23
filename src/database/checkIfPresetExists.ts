import Database from 'better-sqlite3'
import { Logger } from 'electron-log'

export function checkIfPresetExists(
  db: Database,
  avatarId: string,
  unityParameter: number,
  log: Logger
): string | undefined {
  try {
    log.info(`Checking if preset exists...`)
    const existing = db
      .prepare(
        `
            SELECT forUqid FROM presets
            WHERE avatarId = ? AND unityParameter = ?
            LIMIT 1
        `
      )
      .get(avatarId, unityParameter) as { forUqid: string } | undefined

    if (existing?.forUqid) return existing.forUqid
    else return undefined
  } catch {
    log.error(`Error checking if preset exists`)
    return undefined
  }
}
