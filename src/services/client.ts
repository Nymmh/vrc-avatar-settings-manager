import { Client } from 'node-osc'

export function oscClient(): Promise<Client> {
  return new Promise((res) => {
    const OSC_CLIENT = new Client('127.0.0.1', 9000)
    console.log('Client listening on port: ', 9000)
    res(OSC_CLIENT)
  })
}
