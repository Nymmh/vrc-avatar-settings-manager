import { Server } from 'node-osc'
import { Logger } from 'electron-log'

export function oscServer(log: Logger, PORT: number): Promise<Server> {
  log.info('Starting OSC Server...')

  if (process.argv[2]?.startsWith('port=')) {
    PORT = parseInt(process.argv[2].slice(5), 10)
    log.info(`Using custom port from command line argument: ${PORT}`)
  }

  return new Promise((res, rej) => {
    const OSC_SERVER = new Server(PORT, '0.0.0.0', () => {
      log.info(`Server listening on port: ${PORT}`)
      res(OSC_SERVER)
    })

    OSC_SERVER.on('error', (e) => {
      log.error('OSC server error:', e)
      rej(e)
    })
  })
}
