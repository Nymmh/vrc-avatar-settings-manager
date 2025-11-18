import path from 'path'
import fs from 'fs'

export async function lookForCache(avatarId: string, vrcPath: string): Promise<string | undefined> {
  return new Promise((res) => {
    const folders = fs.readdirSync(path.join(vrcPath, 'LocalAvatarData'))

    for (const f of folders) {
      const files = fs.readdirSync(path.join(vrcPath, 'LocalAvatarData', f))
      if (files.includes(avatarId)) {
        res(path.join(f, avatarId))
      }
    }

    res(undefined)
  })
}
