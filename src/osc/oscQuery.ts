import { OSCQAccess, OSCQueryServer, OSCTypeSimple } from 'oscquery'
import { Logger } from 'electron-log'
import { randomNumber } from '../helpers/randomNumber'

export async function oscQuery(log: Logger): Promise<number> {
  log.info('Starting Query...')

  const oscPort = randomNumber()
  const service = new OSCQueryServer({
    oscPort,
    httpPort: oscPort,
    serviceName: 'Nymh-avatar-settings-manager'
  })

  service.addMethod('/avatar/change', {
    access: OSCQAccess.WRITEONLY,
    arguments: [{ type: OSCTypeSimple.STRING }]
  })

  try {
    await service.start()
    log.info(`Query is listening on port ${oscPort}`)
    return oscPort
  } catch (e) {
    log.error('Failed to start Query:', e)
    throw new Error('Failed to start Query')
  }
}
