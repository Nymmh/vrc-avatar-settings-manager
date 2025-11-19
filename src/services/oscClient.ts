import { Client } from 'node-osc'
import { Logger } from 'electron-log'

export function oscClient(log: Logger): Client {
  log.info('Creating OSC Client...')

  const OSC_CLIENT = new Client('127.0.0.1', 9000)

  log.info('Client listening on port: ', 9000)
  return OSC_CLIENT
}
