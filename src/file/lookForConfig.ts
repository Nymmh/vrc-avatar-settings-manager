import path from 'path'
import fs from 'fs'

export function lookForConfig(avatarId: string, vrcOscPath: string): string | undefined {
  try {
    const vrcPath = path.join(vrcOscPath, 'OSC')
    const avatarFile = `${avatarId}.json`
    const folder = fs.readdirSync(vrcPath, { withFileTypes: true })

    for (const f of folder) {
      if (!f.isDirectory()) continue

      const configPath = path.join(vrcPath, f.name, 'Avatars', avatarFile)

      if (fs.existsSync(configPath)) {
        return path.join(f.name, 'Avatars', avatarFile)
      }
    }

    return undefined
  } catch {
    return undefined
  }
}
