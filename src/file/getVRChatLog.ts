import path from 'node:path'
import fsPromises from 'node:fs/promises'
import { Logger } from 'electron-log'

const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')
const LOG_FILE_PREFIX = 'output_log_'
const LOG_FILE_SUFFIX = '.txt'
const MAX_LOG_READ = 2 * 1024 * 1024 // 2MB

const AVATAR_DATA_REGEX = /(Saving Avatar Data|Loading Avatar Data):([a-zA-Z0-9_-]+)/g

interface VRChatLogFile {
  path: string
  name: string
  mtime: Date
  createdAt: Date
}

function getLoadedAvatarId(content: string): string | null {
  AVATAR_DATA_REGEX.lastIndex = 0
  let avatarId: string | null = null
  let match = AVATAR_DATA_REGEX.exec(content)

  while (match) {
    if (match[1] === 'Loading Avatar Data') {
      avatarId = match[2]
    } else if (match[2] !== avatarId) {
      avatarId = null
    }
    match = AVATAR_DATA_REGEX.exec(content)
  }

  return avatarId
}

async function readLog(filePath: string, max: number, fromStart = false): Promise<string> {
  const fileRead = await fsPromises.open(filePath, 'r')

  try {
    const stats = await fileRead.stat()
    const readLength = Math.min(stats.size, max)

    if (readLength <= 0) {
      return ''
    }

    const startPos = fromStart ? 0 : stats.size - readLength
    const buffer = Buffer.allocUnsafe(readLength)
    await fileRead.read(buffer, 0, readLength, startPos)

    return buffer.toString('utf-8')
  } finally {
    await fileRead.close()
  }
}

export async function getVRChatLogFiles(log: Logger): Promise<VRChatLogFile[]> {
  try {
    await fsPromises.access(vrcPath)

    const files = await fsPromises.readdir(vrcPath, { withFileTypes: true })
    const logFiles: VRChatLogFile[] = []

    for (const f of files) {
      if (!f.isFile()) {
        continue
      }

      if (f.name.startsWith(LOG_FILE_PREFIX) && f.name.endsWith(LOG_FILE_SUFFIX)) {
        const filePath = path.join(vrcPath, f.name)
        const stats = await fsPromises.stat(filePath)

        logFiles.push({
          path: filePath,
          name: f.name,
          mtime: stats.mtime,
          createdAt: stats.birthtime
        })
      }
    }

    logFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

    return logFiles
  } catch (error) {
    log.error('Error getting VRChat log files:', error)
    return []
  }
}

export async function getNewestLog(log: Logger): Promise<VRChatLogFile | null> {
  try {
    await fsPromises.access(vrcPath)

    const files = await fsPromises.readdir(vrcPath, { withFileTypes: true })
    let newestFile: VRChatLogFile | null = null
    let newestMtimeMs = -1

    for (const f of files) {
      if (!f.isFile()) {
        continue
      }

      if (!f.name.startsWith(LOG_FILE_PREFIX) || !f.name.endsWith(LOG_FILE_SUFFIX)) {
        continue
      }

      const filePath = path.join(vrcPath, f.name)
      const stats = await fsPromises.stat(filePath)

      if (stats.mtimeMs > newestMtimeMs) {
        newestMtimeMs = stats.mtimeMs
        newestFile = {
          path: filePath,
          name: f.name,
          mtime: stats.mtime,
          createdAt: stats.birthtime
        }
      }
    }

    return newestFile
  } catch (error) {
    log.error('Error getting newest VRChat log file:', error)
    return null
  }
}

export class VRChatLogMonitor {
  private currentNewestFile: VRChatLogFile | null = null
  private checkInterval: NodeJS.Timeout | null = null
  private readonly POLL_INTERVAL = 5000 // 5 seconds

  constructor(
    private log: Logger,
    private onNewLog?: (logFile: VRChatLogFile) => void
  ) {}

  start(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    this.currentNewestFile = null
    this.log.info('Starting VRChat log monitor...')

    void this.checkForNewLog()
    this.checkInterval = setInterval(() => {
      void this.checkForNewLog()
    }, this.POLL_INTERVAL)
  }

  private async checkForNewLog(): Promise<void> {
    const newestFile = await getNewestLog(this.log)

    if (!newestFile) {
      return
    }

    if (!this.currentNewestFile || newestFile.path !== this.currentNewestFile.path) {
      this.currentNewestFile = newestFile
      this.onNewLog?.(newestFile)
      this.log.info('New VRChat log file found')
    }
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.currentNewestFile = null
    this.log.info('VRChat log monitor stopped')
  }

  getCurrentLog(): VRChatLogFile | null {
    return this.currentNewestFile
  }

  async getAvatarIdFromOscQuery(): Promise<string | null> {
    const logFile = this.getCurrentLog()
    if (!logFile) {
      return null
    }

    try {
      const logStart = await readLog(logFile.path, MAX_LOG_READ, true)
      const matches = Array.from(
        logStart.matchAll(/Advertising Service VRChat-Client-\S+ of type OSCQuery on (\d+)/g)
      )
      const port = Number(matches.at(-1)?.[1])
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return null
      }

      const response = await fetch(`http://127.0.0.1:${port}/avatar/change`, {
        signal: AbortSignal.timeout(2000),
        redirect: 'error'
      })
      if (!response.ok) {
        return null
      }

      const node = (await response.json()) as {
        FULL_PATH?: unknown
        TYPE?: unknown
        VALUE?: unknown
      } | null
      const avatarId = Array.isArray(node?.VALUE) ? node.VALUE[0] : null
      if (
        node?.FULL_PATH !== '/avatar/change' ||
        node.TYPE !== 's' ||
        typeof avatarId !== 'string' ||
        !/^avtr_[a-zA-Z0-9_-]+$/.test(avatarId)
      ) {
        return null
      }

      return avatarId
    } catch {
      return null
    }
  }
  async getAvatarIdFromLog(): Promise<string | null> {
    const logFile = this.getCurrentLog()

    if (!logFile) {
      return null
    }

    try {
      const logTail = await readLog(logFile.path, MAX_LOG_READ)
      return getLoadedAvatarId(logTail)
    } catch (error) {
      this.log.error('Error reading VRChat log file:', error)
    }

    return null
  }
}
