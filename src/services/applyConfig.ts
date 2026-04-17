import { Logger } from 'electron-log'
import { Client, Bundle } from 'node-osc'

type ArgumentType = string | number | boolean | { type: string; value: string | number | boolean }
type MessageLike = { address: string; args: ArgumentType[] }

const PARAM_PREFIX = '/avatar/parameters/'
const CHUNK_SIZE = 10

export async function applyConfig(
  log: Logger,
  content: valuedParamsInterface[],
  OSC_CLIENT: Client
): Promise<boolean> {
  try {
    log.info('Starting config upload...')

    if (!content?.length) {
      log.warn('Nothing to upload')
      return false
    }

    const chunks: MessageLike[][] = []
    let chunk: MessageLike[] = []

    for (let i = 0; i < content.length; i++) {
      const c = content[i]

      if (!c.name || c.value === undefined) continue

      const arg: ArgumentType = c.type ? { type: c.type, value: c.value } : c.value

      chunk.push({
        address: `${PARAM_PREFIX}${c.name}`,
        args: [arg]
      })

      if (chunk.length === CHUNK_SIZE) {
        chunks.push(chunk)
        chunk = []
      }
    }

    if (chunk.length > 0) chunks.push(chunk)

    if (chunks.length === 0) {
      log.warn('No valid parameters to upload')
      return false
    }

    for (let i = 0; i < chunks.length; i++) {
      await new Promise<void>((res, rej) => {
        const bundleElements = chunks[i].map((msg) => [msg.address, ...msg.args])
        OSC_CLIENT.send(new Bundle(0, ...bundleElements), (e?: Error | null) => {
          if (e) {
            rej(e)
            return
          }

          res()
        })
      })
    }

    log.info('Config apply completed')
    return true
  } catch (e) {
    log.error('Error during config apply:', e)
    return false
  }
}
