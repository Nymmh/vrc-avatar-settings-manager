import { Bundle, Client } from 'node-osc'
import { Logger } from 'electron-log'
import type { MessageLike, ArgumentType } from 'node-osc'

const PARAM_PREFIX = '/avatar/parameters/'
const CHUNK_SIZE = 10

export async function uploadConfig(
  log: Logger,
  loadedJson: avatarDBInterface,
  OSC_CLIENT: Client
): Promise<boolean> {
  try {
    log.info('Starting config upload...')

    const valuedParams = loadedJson?.valuedParams

    if (!valuedParams?.length) {
      log.info('No parameters found to upload')
      return false
    }

    const chunks: MessageLike[][] = []
    let chunk: MessageLike[] = []

    for (let i = 0; i < valuedParams.length; i++) {
      const ap = valuedParams[i]

      if (typeof ap === 'string' || !ap.name || ap.value === undefined) continue

      const arg: ArgumentType = ap.type ? { type: ap.type, value: ap.value } : ap.value

      chunk.push({
        address: `${PARAM_PREFIX}${ap.name}`,
        args: [arg]
      })

      if (chunk.length === CHUNK_SIZE) {
        chunks.push(chunk)
        chunk = []
      }
    }

    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    if (chunks.length === 0) {
      log.info('No valid parameters found to upload')
      return false
    }

    for (let i = 0; i < chunks.length; i++) {
      await new Promise<void>((res, rej) => {
        OSC_CLIENT.send(new Bundle(...chunks[i]), (e?: Error | null) => {
          if (e) {
            rej(e)
            return
          }

          res()
        })
      })
    }

    log.info('Config upload complete')
    return true
  } catch (e) {
    log.error('Error during config upload:', e)
    return false
  }
}
