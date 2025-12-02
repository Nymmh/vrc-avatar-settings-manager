import { Database } from 'better-sqlite3'
import { generateUqid } from '../../helpers/generateUqid'
import { randomString } from '../../helpers/randomString'

export function generateUniqueUqid(db: Database): string {
  const checkIfExists = db.prepare(`
        SELECT 1 FROM avatars WHERE uqid = ? LIMIT 1
    `)

  let uqid: string
  let attempts = 0

  do {
    uqid = generateUqid(randomString())

    if (attempts >= 10) {
      throw new Error(`Failed to generate uqid`)
    }
  } while (checkIfExists.get(uqid))

  return uqid
}
