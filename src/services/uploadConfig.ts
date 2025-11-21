import { Bundle, Client } from 'node-osc'
import { Logger } from 'electron-log'

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export async function uploadConfig(
  log: Logger,
  loadedJson: avatarConfigInterface,
  OSC_CLIENT: Client
): Promise<boolean> {
  try {
    log.info('Starting config upload...')
    if (loadedJson?.animationParameters && loadedJson?.animationParameters?.length) {
      const formattedParams = loadedJson.animationParameters
        .filter((ap) => ap.name && ap.value !== undefined)
        .map((ap) => ({
          address: `/avatar/parameters/${ap.name}`,
          args: [
            {
              type: ap.type,
              value: ap.value
            }
          ]
        }))

      const chunks = chunkArray(formattedParams, 15)

      for (const chunk of chunks) {
        await OSC_CLIENT.send(new Bundle(...chunk))
      }

      log.info('Config upload completed')
      return true
    } else {
      log.error('No properties to upload')
      return false
    }
  } catch (e) {
    log.error('Error during config upload:', e)
    return false
  }
}
