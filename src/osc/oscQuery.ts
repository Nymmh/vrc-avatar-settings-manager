import { OSCQueryService } from './OSCQueryService'
import { Logger } from 'electron-log'
import { randomNumber } from '../helpers/randomNumber'

export async function oscQuery(
  log: Logger,
  signal?: AbortSignal,
  oscPort: number = randomNumber()
): Promise<{ port: number; service: OSCQueryService }> {
  signal?.throwIfAborted()
  log.info(`Starting Query on port ${oscPort}...`)
  const service = new OSCQueryService(oscPort, log)

  let onAbort: (() => void) | undefined
  try {
    const cancelled = new Promise<never>((_, reject) => {
      onAbort = () => reject(signal?.reason)
      signal?.addEventListener('abort', onAbort, { once: true })
    })
    await Promise.race([service.start(), cancelled])
    signal?.throwIfAborted()
    log.info(`Query is listening on port ${oscPort}`)
    return { port: service.port, service }
  } catch (error) {
    await service.stop().catch((cleanupError) => log.error('Failed to stop Query:', cleanupError))
    throw error
  } finally {
    if (onAbort) signal?.removeEventListener('abort', onAbort)
  }
}
