interface TestAvatarRow {
  id: number
  uqid: string
  avatarId: string
  name: string
  avatarName: string
  nsfw: number
  parameters: string
}

type TestSettings = Map<string, string>

export interface TestDb {
  settings: TestSettings
  avatars: TestAvatarRow[]
  prepare: (sql: string) => {
    all: (value: string) => Array<{ id: number; name: string }>
    get: (
      value: string | number
    ) => { value: string } | { avatarId: string; nsfw: number; parameters: string } | undefined
  }
  close: () => void
}

export function createTestDb(): TestDb {
  const settings = new Map<string, string>()
  const avatars: TestAvatarRow[] = []

  return {
    settings,
    avatars,
    prepare(sql: string) {
      return {
        all(value: string) {
          if (sql.includes('SELECT id,name FROM avatars WHERE avatarId = ?')) {
            return avatars
              .filter((avatar) => avatar.avatarId === value)
              .map((avatar) => ({ id: avatar.id, name: avatar.name }))
          }

          return []
        },
        get(value: string | number) {
          if (sql.includes('SELECT value FROM settings WHERE key = ?')) {
            const settingValue = settings.get(String(value))
            return settingValue === undefined ? undefined : { value: settingValue }
          }

          if (sql.includes('SELECT avatarId,nsfw,parameters FROM avatars WHERE id = ? LIMIT 1')) {
            const row = avatars.find((avatar) => avatar.id === value)
            return row
              ? { avatarId: row.avatarId, nsfw: row.nsfw, parameters: row.parameters }
              : undefined
          }

          return undefined
        }
      }
    },
    close() {
      settings.clear()
      avatars.length = 0
    }
  }
}

export function seedTiplinkSettings(db: TestDb, secret: string): void {
  db.settings.set('tiplinkWebhookSecret', secret)
  db.settings.set('tiplinkWebhookPreviousSecret', '')
  db.settings.set('tiplinkWebhookPreviousSecretExpiresAt', '')
}

export function insertSavedConfig(
  db: TestDb,
  config: {
    id?: number
    uqid: string
    avatarId: string
    name: string
    avatarName?: string
    nsfw?: number
    parameters?: string
  }
): void {
  db.avatars.push({
    id: config.id ?? db.avatars.length + 1,
    uqid: config.uqid,
    avatarId: config.avatarId,
    name: config.name,
    avatarName: config.avatarName ?? 'Avatar',
    nsfw: config.nsfw ?? 0,
    parameters: config.parameters ?? '[]'
  })
}
