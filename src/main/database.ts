import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import Database, { Database as DBType } from 'better-sqlite3'
import { Logger } from 'electron-log'

export function database(log: Logger): DBType {
  log.info('Initializing Meow Storage...')
  const dbPath = path.join(app.getPath('userData'), 'Meow Storage')

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath)
    log.info(`Created Meow Storage`)
  }

  const db: DBType = new Database(path.join(dbPath, 'data.db'))

  db.pragma('journal_mode = WAL')

  let version = db.pragma('user_version', { simple: true }) as number

  if (version === 0) {
    log.info('Setting up Meow Storage version 1')
    db.prepare(
      `CREATE TABLE IF NOT EXISTS avatars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            avatarId TEXT,
            name TEXT UNIQUE,
            avatarName TEXT,
            nsfw BOOLEAN DEFAULT 0,
            parameters TEXT,
            fromFile BOOLEAN DEFAULT 0
        );`
    ).run()

    db.pragma('user_version = 1')
    version = 1
  }

  log.info(`Meow storage setup complete`)
  return db
}
