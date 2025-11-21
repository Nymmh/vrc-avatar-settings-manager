import path from 'path'
import fs from 'fs'

export async function lookForConfig(
  avatarId: string,
  vrcOscPath: string
): Promise<string | undefined> {
  return new Promise((res) => {
    const folders = fs.readdirSync(path.join(vrcOscPath, 'OSC'))

    for (const f of folders) {
      const files = fs.readdirSync(path.join(vrcOscPath, 'OSC', f, 'Avatars'))
      if (files.includes(avatarId + '.json')) {
        res(path.join(f, 'Avatars', avatarId + '.json'))
      }
    }

    res(undefined)
  })
}
