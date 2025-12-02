import { Database } from 'better-sqlite3'

export function generateNextPresetNumber(db: Database, avatarId: string): number {
  const allPresets = db
    .prepare(
      `
        SELECT unityParameter FROM presets WHERE avatarId = ? ORDER BY unityParameter ASC
    `
    )
    .all(avatarId) as Array<{ unityParameter: number }>

  if (allPresets.length === 0) {
    return 1
  }

  const existingNumbers = new Set<number>(allPresets.map((p) => p.unityParameter))
  let presetNumber = 1

  while (existingNumbers.has(presetNumber)) {
    presetNumber++
  }

  return presetNumber
}
