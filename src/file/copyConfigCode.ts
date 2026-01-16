import { brotliCompressSync, deflateSync, constants } from 'node:zlib'
import { BrowserWindow, clipboard, Dialog } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { showDialogNoSound } from '../services/showDialogNoSound'
import { checksum } from '../helpers/checksum'
import { toBase91 } from '../helpers/toBase91'
import { getCopyForDiscordSetting } from '../database/getCopyForDiscordSetting'
import { exportConfig } from './exportConfig'
import { exportShareCode } from './exportShareCode'

interface ExportDataInterface {
  t: string
  p: (string | number | boolean | undefined)[][]
  a?: string
  u?: string
  n?: string
  an?: string
  ns?: number
  ip?: number
  pr?: Partial<avatarPresetsInterface>
}

function copyShareCode(shareCode: string, log: Logger): exportConfigInterface {
  clipboard.writeText(shareCode)
  log.info('Share Code copied to clipboard')

  return { success: true, message: 'Share Code copied to clipboard' }
}

async function startExport(
  log: Logger,
  db: Database,
  dialog: Dialog,
  mainWindow: BrowserWindow,
  data: string,
  avatarName: string,
  name: string,
  id: number
): Promise<exportConfigInterface> {
  const shareCodeExportToFileResponse = await showDialogNoSound(
    ['Share Code', 'JSON', 'Cancel'],
    0,
    'How would you like to export the config?',
    `Share Code can be pasted into the app directly, while JSON can be imported via file.`,
    mainWindow
  )

  if (shareCodeExportToFileResponse.response === 0) {
    return await exportShareCode(log, dialog, mainWindow, data, avatarName, name)
  } else if (shareCodeExportToFileResponse.response === 1) {
    return await exportConfig(log, db, dialog, mainWindow, id)
  } else {
    log.info('User cancelled exporting config')
    return { success: false, message: 'Cancelled exporting config' }
  }
}

function cancelCopy(log: Logger): exportConfigInterface {
  log.info('User cancelled copying config code')
  return { success: false, message: 'Cancelled copying config code' }
}

export async function copyConfigCode(
  log: Logger,
  db: Database,
  dialog: Dialog,
  mainWindow: BrowserWindow,
  id: number | string,
  directExport = false
): Promise<exportConfigInterface> {
  try {
    if (!id || typeof id !== 'number' || id <= 0) {
      log.error('Invalid ID provided for export')
      return { success: false, message: 'Invalid ID provided' }
    }

    const q = db
      .prepare(
        'SELECT uqid, avatarId, name, avatarName, nsfw, parameters, isPreset FROM avatars WHERE id = ? LIMIT 1'
      )
      .get(id) as avatarDBInterface | undefined

    if (!q) {
      log.error('No configuration found')
      return { success: false, message: 'No config found' }
    }

    let savePresets = 0

    if (q?.isPreset) {
      const userResponse = await showDialogNoSound(
        ['Yes', 'No'],
        0,
        'Marked As Preset',
        `This config is marked as a preset, would you like to export them too?`,
        mainWindow
      )

      if (userResponse.response === 0) savePresets = 1
    }

    let parsed: valuedParamsInterface[] = []
    const presets: Partial<avatarPresetsInterface> = {}

    if (savePresets) {
      const p = db
        .prepare('SELECT avatarId, name, unityParameter FROM presets WHERE forUqid = ? LIMIT 1')
        .get(q.uqid) as avatarPresetsInterface | undefined

      if (p) {
        presets.forUqid = q.uqid
        presets.avatarId = p.avatarId
        presets.name = p.name
        presets.unityParameter = p.unityParameter
      }
    }

    try {
      parsed = JSON.parse(q.parameters || '[]') || []
    } catch {
      log.error('Invalid JSON')
      return { success: false, message: 'Invalid JSON' }
    }

    const checksumVersion = db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('checksumVersion').value as string | undefined

    if (!checksumVersion) {
      log.error('Checksum version not found')
      return { success: false, message: 'Checksum version not found' }
    }
    const compactParams = parsed
      .filter((p: valuedParamsInterface) => p.value !== 0)
      .map((p: valuedParamsInterface) => {
        return p.type && p.type !== 'i' ? [p.name, p.value, p.type] : [p.name, p.value]
      })

    const exportData: ExportDataInterface = {
      t: 'c',
      p: compactParams
    }

    if (q.avatarId && q.avatarId !== 'Unknown') exportData.a = q.avatarId
    if (q.uqid) exportData.u = q.uqid
    if (q.name) exportData.n = q.name
    if (q.avatarName && q.avatarName !== 'Unknown') exportData.an = q.avatarName
    if (q.nsfw) exportData.ns = 1
    if (q.isPreset) exportData.ip = 1
    if (Object.keys(presets).length > 0) exportData.pr = presets

    const jsonString = JSON.stringify(exportData)
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

    let shareCode = `ASM:v${checksumVersion}:${sum}:${encoded}`
    const shareCodeStored = shareCode

    if (directExport) {
      return exportShareCode(
        log,
        dialog,
        mainWindow,
        shareCodeStored,
        q.avatarName || 'Unknown',
        q.name || 'Unknown'
      )
    }

    const copyToDiscord = getCopyForDiscordSetting(db, log)

    if (copyToDiscord) {
      shareCode = `\`\`\`${shareCode}\`\`\``
    }

    if (shareCode.length >= 4000) {
      log.error(`Exported share code is too long to copy ${shareCode.length}`)

      const shareCodeCopyResponse = await showDialogNoSound(
        ['Copy', 'Export to File', 'Cancel'],
        0,
        'Share Code is too long to copy',
        `The exported share code length is too long to copy to Discord. Do you want to copy it anyway?`,
        mainWindow
      )

      if (shareCodeCopyResponse.response === 0) {
        return copyShareCode(shareCode, log)
      } else if (shareCodeCopyResponse.response === 1) {
        return startExport(
          log,
          db,
          dialog,
          mainWindow,
          shareCodeStored,
          q.avatarName || 'Unknown',
          q.name || 'Unknown',
          id
        )
      } else {
        return cancelCopy(log)
      }
    } else {
      if (shareCode.length >= 2000) {
        log.error(`Exported share code is too long to copy ${shareCode.length}`)

        const shareCodeCopyResponse = await showDialogNoSound(
          ['Copy', 'Export to File', 'Cancel'],
          0,
          'Share Code is too long to copy',
          `The exported share code length is too long to copy to Discord without Discord Nitro. Do you want to copy it anyway?`,
          mainWindow
        )

        if (shareCodeCopyResponse.response === 0) {
          return copyShareCode(shareCode, log)
        } else if (shareCodeCopyResponse.response === 1) {
          return startExport(
            log,
            db,
            dialog,
            mainWindow,
            shareCodeStored,
            q.avatarName || 'Unknown',
            q.name || 'Unknown',
            id
          )
        } else {
          return cancelCopy(log)
        }
      } else {
        return copyShareCode(shareCode, log)
      }
    }
  } catch (e) {
    log.error('Error copying config code:', e)
    return { success: false, message: 'Error copying config code' }
  }
}
