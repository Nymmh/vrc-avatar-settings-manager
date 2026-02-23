import path from 'node:path'
import fsPromises from 'node:fs/promises'
import { Logger } from 'electron-log'

const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')
const LOG_FILE_PREFIX = 'output_log_'
const LOG_FILE_SUFFIX = '.txt'
const MAX_LOG_READ = 2 * 1024 * 1024 // 2MB

const AVATAR_DATA_REGEX = /(Saving Avatar Data|Loading Avatar Data|avatar):([a-zA-Z0-9_-]+)/g

interface VRChatLogFile {
  path: string
  name: string
  mtime: Date
}

interface AvatarMatch {
  source: string
  avatarId: string
}

function getNewestAvatarMatch(content: string): AvatarMatch | null {
  AVATAR_DATA_REGEX.lastIndex = 0
  let latestMatch: AvatarMatch | null = null
  let match = AVATAR_DATA_REGEX.exec(content)

  while (match) {
    latestMatch = {
      source: match[1],
      avatarId: match[2]
    }
    match = AVATAR_DATA_REGEX.exec(content)
  }

  return latestMatch
}

async function readLogEnd(filePath: string, max: number): Promise<string> {
  const fileRead = await fsPromises.open(filePath, 'r')

  try {
    const stats = await fileRead.stat()
    const readLength = Math.min(stats.size, max)

    if (readLength <= 0) {
      return ''
    }

    const startPos = stats.size - readLength
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
          mtime: stats.mtime
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
          mtime: stats.mtime
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

  async getAvatarIdFromLog(): Promise<string | null> {
    const logFile = this.getCurrentLog()

    if (!logFile) {
      return null
    }

    try {
      const logTail = await readLogEnd(logFile.path, MAX_LOG_READ)
      const newestAvatarMatch = getNewestAvatarMatch(logTail)

      if (newestAvatarMatch) {
        if (newestAvatarMatch.source === 'avatar') {
          this.log.warn('Using fallback search for avatar ID... might be wrong')
        }

        return newestAvatarMatch.avatarId
      }
    } catch (error) {
      this.log.error('Error reading VRChat log file:', error)
    }

    return null
  }
}
