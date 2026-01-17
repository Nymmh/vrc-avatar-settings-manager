import { Logger } from 'electron-log'
import path from 'node:path'
import fs from 'fs'

interface DataFolder {
  folderPath: string
  avatarConfigData: string
  avatarData: string
  fullExport: string
}

async function getDirStats(dirPath: string, files: string[]): Promise<number> {
  const statPromises = files.map((file) =>
    fs.promises.stat(path.join(dirPath, file)).then((stats) => stats.size)
  )
  const sizes = await Promise.all(statPromises)
  return sizes.reduce((total, size) => total + size, 0)
}

export async function getExportedFileCount(
  log: Logger,
  dataFolder: DataFolder
): Promise<exportedFileCountInterface | null> {
  log.info('Fetching exported file count...')

  try {
    const readDir = async (dirPath: string): Promise<string[]> => {
      try {
        return await fs.promises.readdir(dirPath)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          return []
        }
        throw err
      }
    }

    const [fullExports, avatarExports, configExports] = await Promise.all([
      readDir(dataFolder.fullExport),
      readDir(dataFolder.avatarData),
      readDir(dataFolder.avatarConfigData)
    ])

    log.info('Got all export counts')

    const [fullSize, avatarSize, configSize] = await Promise.all([
      getDirStats(dataFolder.fullExport, fullExports),
      getDirStats(dataFolder.avatarData, avatarExports),
      getDirStats(dataFolder.avatarConfigData, configExports)
    ])

    const totalSize = fullSize + avatarSize + configSize
    const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2)

    log.info('Got all export sizes')

    return {
      fullExports: fullExports.length,
      avatarExports: avatarExports.length,
      configExports: configExports.length,
      totalSize: `${totalSizeInMB} MB`
    }
  } catch (e) {
    log.error('Error fetching exported file count', e)
    return null
  }
}
