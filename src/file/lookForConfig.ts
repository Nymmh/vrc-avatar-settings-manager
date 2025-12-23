import path from 'path'
import fs from 'fs'
import { Logger } from 'electron-log'

export function lookForConfig(
  avatarId: string,
  vrcOscPath: string,
  log: Logger
): string | undefined {
  try {
    log.info('Looking for config for avatarId: ', avatarId)
    const vrcPath = path.join(vrcOscPath, 'OSC')
    const avatarFile = `${avatarId}.json`
    const folder = fs.readdirSync(vrcPath, { withFileTypes: true })

    for (const f of folder) {
      if (!f.isDirectory()) continue

      const configPath = path.join(vrcPath, f.name, 'Avatars', avatarFile)

      if (fs.existsSync(configPath)) {
        log.info('Found config')
        return path.join(f.name, 'Avatars', avatarFile)
      }
    }

    return undefined
  } catch {
    log.error('Error finding config for avatarId: ', avatarId)
    return undefined
  }
}
