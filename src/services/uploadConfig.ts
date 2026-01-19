import { Bundle, Client } from 'node-osc'
import { Logger } from 'electron-log'

export async function uploadConfig(
  log: Logger,
  loadedJson: avatarDBInterface,
  OSC_CLIENT: Client
): Promise<boolean> {
  try {
    log.info('Starting config upload...')

    if (!loadedJson?.valuedParams?.length) {
      log.info('No parameters found to upload')
      return false
    }

    const chunks: unknown[][] = []
    let chunk: unknown[] = []

    for (let i = 0; i < loadedJson.valuedParams.length; i++) {
      const ap = loadedJson.valuedParams[i]

      if (typeof ap === 'string' || !ap.name || ap.value === undefined) continue

      chunk.push({
        address: `/avatar/parameters/${ap.name}`,
        args: [
          {
            type: ap.type,
            value: ap.value
          }
        ]
      })

      if (chunk.length === 10) {
        chunks.push(chunk)
        chunk = []
      }
    }

    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    for (let i = 0; i < chunks.length; i++) {
      await OSC_CLIENT.send(new Bundle(...chunks[i]))
    }

    log.info('Config upload complete')
    return true
  } catch (e) {
    log.error('Error during config upload:', e)
    return false
  }
}
