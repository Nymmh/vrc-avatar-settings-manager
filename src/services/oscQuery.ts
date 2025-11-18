import { OSCQAccess, OSCQueryServer, OSCTypeSimple } from 'oscquery'
import { randomNumber } from './randomNumber'

export function oscQuery(): Promise<number> {
  return new Promise((res) => {
    let oscPort = randomNumber()

    const service = new OSCQueryServer({
      oscPort,
      httpPort: oscPort,
      serviceName: 'Nymh-avi-settings-copy'
    })

    service.addMethod('/avatar/change', {
      access: OSCQAccess.WRITEONLY,
      arguments: [{ type: OSCTypeSimple.STRING }]
    })

    service.start().then(() => {
      console.log(`OSCQuery server is listening on port ${oscPort}`)
      res(oscPort)
    })
  })
}
