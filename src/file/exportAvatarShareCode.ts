import { brotliCompressSync, deflateSync, constants } from 'node:zlib'
import { BrowserWindow, Dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { checksum } from '../helpers/checksum'
import { toBase91 } from '../helpers/toBase91'
import { checkDataFolder } from './checkDataFolder'
import path from 'node:path'
import fs from 'fs'

interface exportAvatarData {
  type: string
  version: string
  avatarId: string | undefined
  name: string | undefined
  configs: avatarDBInterface[]
}

export async function exportAvatarShareCode(
  log: Logger,
  db: Database,
  dialog: Dialog,
  mainWindow: BrowserWindow,
  data: exportAvatarData
): Promise<exportConfigInterface> {
  const checksumVersion = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('checksumVersion').value as string | undefined

  if (!checksumVersion) {
    log.error('Checksum version not found')
    return { success: false, message: 'Checksum version not found' }
  }

  const jsonString = JSON.stringify(data)
  const brotli = brotliCompressSync(Buffer.from(jsonString), {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_SIZE_HINT]: jsonString.length
    }
  })

  const deflate = deflateSync(Buffer.from(jsonString), { level: 9 })
  const compressed = brotli.length < deflate.length ? brotli : deflate
  const encoded = toBase91(compressed)
  const sum = checksum(encoded)

  const shareCode = `ASM:v${checksumVersion}:${sum}:${encoded}`

  try {
    log.info(`Starting export of share code`)

    const { avatarData } = checkDataFolder()

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Config',
      defaultPath: `${path.join(avatarData, `sharecode_avatar_${data.name}`)}.txt`,
      filters: [
        { name: 'TXT', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (canceled || !filePath) {
      log.info('Export canceled or no file path specified')
      return { success: false, message: 'Export canceled or no file path specified' }
    }

    await fs.promises.writeFile(filePath, shareCode, 'utf-8')

    log.info(`Share Code exported successfully`)
    return { success: true, message: 'Share Code exported' }
  } catch (e) {
    log.error(`Error exporting share code: ${e}`)
    return { success: false, message: 'Error exporting share code' }
  }
}
