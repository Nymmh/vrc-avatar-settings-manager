import Database from 'better-sqlite3'

export function setSaveFaceTrackingSetting(db: Database, value: boolean): boolean {
  try {
    const u = db.prepare(`UPDATE settings SET value = ? WHERE key = 'saveFaceTrackingSettings'`)
    u.run(value ? 'true' : 'false')
    return true
  } catch {
    return false
  }
}
