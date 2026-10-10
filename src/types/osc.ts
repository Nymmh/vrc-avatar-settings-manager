import type { Client, Server } from 'node-osc'
import type { OSCQueryService } from '../osc/OSCQueryService'

export interface OSCReceiver {
  handleMessage: (data: unknown[]) => void
  stop: () => void
}

export interface OSCConnection {
  client: Client
  server: Server
  query: OSCQueryService
  stop: () => Promise<void>
}

export type { OSCStartupStatus } from './oscStartupStatus'
