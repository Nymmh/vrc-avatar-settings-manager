import { Logger } from 'electron-log'
import { Client, Bundle } from 'node-osc'

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export async function applyConfig(
  log: Logger,
  content: animationParametersInterface[],
  OSC_CLIENT: Client
): Promise<boolean> {
  try {
    log.info('Starting config upload...')
    if (!content || !content.length) {
      log.error('Nothing to upload')
      return false
    }

    const formattedParams = content
      .filter((c) => c.name && c.value !== undefined)
      .map((c) => ({
        address: `/avatar/parameters/${c.name}`,
        args: [
          {
            type: c.type,
            value: c.value
          }
        ]
      }))

    const chunks = chunkArray(formattedParams, 15)

    for (const chunk of chunks) {
      await OSC_CLIENT.send(new Bundle(...chunk))
    }

    log.info('Config upload completed')
    return true
  } catch (e) {
    log.error('Error during config upload:', e)
    return false
  }
}
