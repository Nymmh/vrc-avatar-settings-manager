import { Server } from 'node-osc'

export function oscServer(PORT: number): Promise<Server> {
  return new Promise((res) => {
    console.log('Trying to start server...')

    const OSC_SERVER = new Server(PORT, '0.0.0.0')

    OSC_SERVER.on('listening', () => {
      console.log('Server listening on port: ', PORT)
      res(OSC_SERVER)
    })
  })
}
