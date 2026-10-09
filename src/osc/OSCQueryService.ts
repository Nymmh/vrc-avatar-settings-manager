import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { getResponder, type Protocol, type CiaoService, type Responder } from '@homebridge/ciao'
import type { Logger } from 'electron-log'

const serviceName = 'Nymh-avatar-settings-manager'
const extensions = {
  ACCESS: true,
  VALUE: true,
  RANGE: true,
  DESCRIPTION: true,
  TAGS: true,
  CRITICAL: true,
  CLIPMODE: true
}
const change = { FULL_PATH: '/avatar/change', ACCESS: 2, TYPE: 's' }
const avatar = { FULL_PATH: '/avatar', ACCESS: 0, CONTENTS: { change } }
const root = { FULL_PATH: '/', DESCRIPTION: 'root node', ACCESS: 0, CONTENTS: { avatar } }
const nodes = new Map<string, Record<string, unknown>>([
  [root.FULL_PATH, root],
  [avatar.FULL_PATH, avatar],
  [change.FULL_PATH, change]
])
const attributes = new Set([
  'FULL_PATH',
  'CONTENTS',
  'TYPE',
  'ACCESS',
  'RANGE',
  'DESCRIPTION',
  'TAGS',
  'CRITICAL',
  'CLIPMODE',
  'VALUE'
])

export class OSCQueryService {
  private readonly server: http.Server
  private responder?: Responder
  private advertisement?: CiaoService
  private advertising?: Promise<void>
  private starting?: Promise<void>
  private stopping?: Promise<void>
  private stopped = false
  private rejectBind?: (error: Error) => void
  private boundPort: number

  constructor(
    port: number,
    private readonly log: Logger
  ) {
    this.boundPort = port
    this.server = http.createServer((request, response) => this.handleRequest(request, response))
    this.server.on('error', (error) => {
      if (this.rejectBind) this.rejectBind(error)
      else this.log.error('OSCQuery HTTP error:', error)
    })
  }

  get port(): number {
    return this.boundPort
  }

  start(): Promise<void> {
    this.starting ??= this.listenAndAdvertise()
    return this.starting
  }

  private async listenAndAdvertise(): Promise<void> {
    if (this.stopped) throw new Error('OSCQuery service stopped')
    try {
      await new Promise<void>((resolve, reject) => {
        this.rejectBind = reject
        this.server.once('listening', () => {
          if (this.stopped) {
            this.server.close()
            reject(new Error('OSCQuery startup cancelled'))
            return
          }

          this.boundPort = (this.server.address() as AddressInfo).port
          resolve()
        })
        this.server.listen(this.boundPort, '0.0.0.0')
      })
    } finally {
      this.rejectBind = undefined
    }

    if (this.stopped) throw new Error('OSCQuery startup cancelled')

    this.responder = getResponder()
    this.advertisement = this.responder.createService({
      name: serviceName,
      type: 'oscjson',
      port: this.port,
      protocol: 'tcp' as Protocol,
      hostname: `${serviceName}._oscjson._tcp`
    })
    this.advertising = this.advertisement.advertise()

    await this.advertising

    if (this.stopped) throw new Error('OSCQuery startup cancelled')
  }

  stop(): Promise<void> {
    if (this.stopping) return this.stopping
    this.stopped = true
    this.rejectBind?.(new Error('OSCQuery startup cancelled'))
    this.stopping = Promise.all([
      new Promise<void>((resolve, reject) => {
        this.server.close((error?: NodeJS.ErrnoException) => {
          if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') reject(error)
          else resolve()
        })
        this.server.closeAllConnections()
      }),
      this.stopDiscovery()
    ]).then(() => {})

    return this.stopping
  }

  private async stopDiscovery(): Promise<void> {
    await this.advertising?.catch(() => {})
    try {
      await this.advertisement?.destroy()
    } finally {
      await this.responder?.shutdown()
    }
  }

  private handleRequest(request: IncomingMessage, response: ServerResponse): void {
    if (request.method !== 'GET') {
      response.writeHead(400).end()
      return
    }

    let url: URL
    try {
      url = new URL(request.url ?? '/', 'http://localhost')
    } catch {
      response.writeHead(400).end()
      return
    }

    const attribute = url.search.slice(1)
    if (attribute === 'HOST_INFO') {
      this.respond(response, {
        EXTENSIONS: extensions,
        OSC_IP: '0.0.0.0',
        OSC_PORT: this.port,
        OSC_TRANSPORT: 'UDP'
      })

      return
    }

    if (attribute && !attributes.has(attribute)) {
      response.writeHead(400).end()
      return
    }

    const node = nodes.get('/' + url.pathname.split('/').filter(Boolean).join('/'))

    if (!node) {
      response.writeHead(404).end()
      return
    }

    if (attribute === 'VALUE') {
      response.writeHead(204).end()
      return
    }

    this.respond(response, attribute ? { [attribute]: node[attribute] } : node)
  }

  private respond(response: ServerResponse, value: unknown): void {
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(value))
  }
}
