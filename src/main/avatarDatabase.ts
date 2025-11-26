import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import Database, { Database as DBType } from 'better-sqlite3'
import { Logger } from 'electron-log'

export function avatarDatabase(log: Logger): DBType {
  log.info('Initializing Meow Storage...')
  const dbPath = path.join(app.getPath('userData'), 'Meow Storage')

  fs.mkdirSync(dbPath, { recursive: true })

  const db: DBType = new Database(path.join(dbPath, 'meow.db'))

  db.pragma('journal_mode = WAL')

  const version = db.pragma('user_version', { simple: true }) as number

  if (version === 0) {
    db.transaction(() => {
      db.prepare(
        `CREATE TABLE IF NOT EXISTS avatars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uqid TEXT UNIQUE NOT NULL,
            avatarId TEXT NOT NULL,
            name TEXT NOT NULL,
            avatarName TEXT NOT NULL,
            nsfw INTEGER DEFAULT 0 NOT NULL,
            parameters TEXT DEFAULT '[]' NOT NULL,
            fromFile INTEGER DEFAULT 0 NOT NULL,
            isPreset INTEGER DEFAULT 0 NOT NULL
        )`
      ).run()

      db.prepare(
        `CREATE TABLE IF NOT EXISTS presets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          forUqid TEXT NOT NULL UNIQUE,
          avatarId TEXT NOT NULL,
          name TEXT NOT NULL DEFAULT '',
          unityParameter INTEGER,
          UNIQUE(forUqid, unityParameter)
        )`
      ).run()

      db.prepare(
        `CREATE TABLE IF NOT EXISTS avatarStorage(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        avatarId TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL
        )`
      ).run()

      db.prepare(`CREATE INDEX IF NOT EXISTS idx_avatars_name ON avatars (name)`).run()
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_presets_avatarId ON presets (avatarId)`).run()
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_avatars_avatarId ON avatars (avatarId)`).run()

      db.pragma('user_version = 1')
    })()

    log.info('Meow Storage ver 1 setup complete')
  }

  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = -7168')
  db.pragma('temp_store = MEMORY')

  log.info('Meow Storage initialized successfully')
  return db
}
