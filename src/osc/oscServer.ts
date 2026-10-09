import { Server } from 'node-osc'
import { Logger } from 'electron-log'

export function oscServer(log: Logger, PORT: number, signal?: AbortSignal): Promise<Server> {
  signal?.throwIfAborted()
  log.info('Starting OSC Server...')

  return new Promise((resolve, reject) => {
    let settled = false

    const server = new Server(PORT, '0.0.0.0', () => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', onAbort)
      log.info(`Server listening on port: ${PORT}`)
      resolve(server)
    })

    const fail = (error: unknown): void => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', onAbort)

      try {
        server.close(() => reject(error))
      } catch (cleanupError) {
        log.error('Failed to close OSC server:', cleanupError)
        reject(error)
      }
    }

    const onAbort = (): void => fail(signal?.reason)

    signal?.addEventListener('abort', onAbort, { once: true })

    server.on('error', (error) => {
      if (settled) log.error('OSC server error:', error)
      else fail(error)
    })
  })
}
