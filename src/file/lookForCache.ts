import path from 'path'
import fs from 'fs'

export function lookForCache(avatarId: string, vrcPath: string): string | undefined {
  try {
    const avatarData = path.join(vrcPath, 'LocalAvatarData')
    const folders = fs.readdirSync(avatarData, { withFileTypes: true })

    for (const f of folders) {
      if (!f.isDirectory()) continue

      const folderPath = path.join(avatarData, f.name)
      const ap = path.join(folderPath, avatarId)

      if (fs.existsSync(ap)) {
        return path.join(f.name, avatarId)
      }
    }

    return undefined
  } catch {
    return undefined
  }
}
