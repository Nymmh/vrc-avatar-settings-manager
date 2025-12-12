import Database from 'better-sqlite3'

export function getSaveFaceTrackingSetting(db: Database): boolean {
  try {
    const faceTrackingSetting = db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('saveFaceTrackingSettings') as { value: string } | undefined

    if (faceTrackingSetting?.value === 'true') {
      return true
    } else {
      return false
    }
  } catch {
    return false
  }
}
