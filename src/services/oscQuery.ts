import { OSCQAccess, OSCQueryServer, OSCTypeSimple } from 'oscquery'
import { Logger } from 'electron-log'
import { randomNumber } from './randomNumber'

export async function oscQuery(log: Logger): Promise<number> {
  log.info('Starting OSCQuery server...')

  const oscPort = randomNumber()
  const service = new OSCQueryServer({
    oscPort,
    httpPort: oscPort,
    serviceName: 'Nymh-avi-settings-copy'
  })

  service.addMethod('/avatar/change', {
    access: OSCQAccess.WRITEONLY,
    arguments: [{ type: OSCTypeSimple.STRING }]
  })

  try {
    await service.start()
    log.info(`OSCQuery server is listening on port ${oscPort}`)
    return oscPort
  } catch (e) {
    log.error('Failed to start OSCQuery server:', e)
    throw new Error('Failed to start OSCQuery server')
  }
}
