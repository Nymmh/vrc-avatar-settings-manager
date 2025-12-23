import path from 'path'
import fs from 'fs'
import { Logger } from 'electron-log'

export function lookForCache(avatarId: string, vrcPath: string, log: Logger): string | undefined {
  try {
    log.info('Looking for cache for avatarId: ', avatarId)
    const avatarData = path.join(vrcPath, 'LocalAvatarData')
    const folders = fs.readdirSync(avatarData, { withFileTypes: true })

    for (const f of folders) {
      if (!f.isDirectory()) continue

      const folderPath = path.join(avatarData, f.name)
      const ap = path.join(folderPath, avatarId)

      if (fs.existsSync(ap)) {
        log.info('Found cache')
        return path.join(f.name, avatarId)
      }
    }

    return undefined
  } catch {
    log.error('Error finding cache for avatarId: ', avatarId)
    return undefined
  }
}
