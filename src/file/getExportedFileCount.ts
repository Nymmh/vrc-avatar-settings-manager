import { Logger } from 'electron-log'
import path from 'node:path'
import fs from 'fs'

interface DataFolder {
  folderPath: string
  avatarConfigData: string
  avatarData: string
  fullExport: string
}

export async function getExportedFileCount(
  log: Logger,
  dataFolder: DataFolder
): Promise<exportedFileCountInterface | null> {
  log.info('Fetching exported file count...')

  try {
    let fullSize = 0
    const fullExports = await fs.promises.readdir(dataFolder.fullExport)
    const fullExportCount = fullExports.length | 0

    for (const file of fullExports) {
      const filePath = path.join(dataFolder.fullExport, file)
      const stats = await fs.promises.stat(filePath)
      fullSize += stats.size
    }

    log.info('Got full export count and size')
    const avatarExports = await fs.promises.readdir(dataFolder.avatarData)
    const avatarExportCount = avatarExports.length | 0

    for (const file of avatarExports) {
      const filePath = path.join(dataFolder.avatarData, file)
      const stats = await fs.promises.stat(filePath)
      fullSize += stats.size
    }

    log.info('Got avatar export count and size')
    const configExports = await fs.promises.readdir(dataFolder.avatarConfigData)
    const configExportCount = configExports.length | 0

    for (const file of configExports) {
      const filePath = path.join(dataFolder.avatarConfigData, file)
      const stats = await fs.promises.stat(filePath)
      fullSize += stats.size
    }

    log.info('Got config export count and size')
    const fullSizeInMB = (fullSize / (1024 * 1024)).toFixed(2)

    return {
      fullExports: fullExportCount,
      avatarExports: avatarExportCount,
      configExports: configExportCount,
      totalSize: `${fullSizeInMB} MB`
    }
  } catch (e) {
    log.error('Error fetching exported file count', e)
    return null
  }
}
