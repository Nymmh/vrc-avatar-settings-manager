import { Logger } from 'electron-log'
import { Client, Bundle } from 'node-osc'

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

    const chunks: unknown[][] = []
    let chunk: unknown[] = []

    for (let i = 0; i < content.length; i++) {
      const c = content[i]

      if (!c.name || c.value === undefined) continue

      chunk.push({
        address: `/avatar/parameters/${c.name}`,
        args: [
          {
            type: c.type,
            value: c.value
          }
        ]
      })

      if (chunk.length === 15) {
        chunks.push(chunk)
        chunk = []
      }
    }

    if (chunk.length > 0) chunks.push(chunk)

    for (let i = 0; i < chunks.length; i++) {
      await OSC_CLIENT.send(new Bundle(...chunks[i]))
    }

    log.info('Config apply completed')
    return true
  } catch (e) {
    log.error('Error during config apply:', e)
    return false
  }
}
