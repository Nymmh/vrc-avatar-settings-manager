import { Server } from 'node-osc'
import { Logger } from 'electron-log'

export async function oscServer(log: Logger, PORT: number): Promise<Server> {
  log.info('Starting OSC server...')

  return new Promise((res, rej) => {
    const OSC_SERVER = new Server(PORT, '0.0.0.0')

    OSC_SERVER.on('listening', () => {
      log.info(`Server listening on port: ${PORT}`)
      res(OSC_SERVER)
    })

    OSC_SERVER.on('error', (e) => {
      log.error('OSC server error:', e)
      rej(e)
    })
  })
}
