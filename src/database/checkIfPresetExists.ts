import Database from 'better-sqlite3'

export function checkIfPresetExists(
  db: Database,
  avatarId: string,
  unityParameter: number
): string | undefined {
  try {
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
    return undefined
  }
}
