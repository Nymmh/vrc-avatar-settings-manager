import path from 'path'
import fs from 'fs'
import { Logger } from 'electron-log'

export function deleteOldLog(log: Logger, folderPath: string): void {
  log.info('Checking for old log files to delete...')

  try {
    const files = fs.readdirSync(folderPath)
    const oldLogFiles = files.filter((file) => file.includes('old.log'))

    if (oldLogFiles.length === 0) {
      log.info('No old log files found')
      return
    }

    oldLogFiles.forEach((file) => {
      const filePath = path.join(folderPath, file)
      try {
        fs.unlinkSync(filePath)
        log.info(`Deleted old log file: ${file}`)
      } catch (error) {
        log.error(`Failed to delete old log file ${file}:`, error)
      }
    })
  } catch (error) {
    log.error('Error reading folder for old log files:', error)
  }
}
