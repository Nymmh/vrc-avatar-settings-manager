import { Database } from 'better-sqlite3'

export function generateNextPresetNumber(db: Database, avatarId: string): number {
  const allPresets = db
    .prepare(
      `
        SELECT unityParameter FROM presets WHERE avatarId = ? ORDER BY unityParameter ASC
    `
    )
    .all(avatarId) as Array<{ unityParameter: number }>

  if (allPresets.length <= 1) {
    return 1
  }

  const existingNumbers = new Set<number>(allPresets.map((p) => p.unityParameter))
  let presetNumber = 1
  const maxPresets = 1000

  while (existingNumbers.has(presetNumber) && presetNumber < maxPresets) {
    presetNumber++
  }

  if (presetNumber >= maxPresets) {
    throw new Error('Max preset number exceeded')
  }

  return presetNumber
}
