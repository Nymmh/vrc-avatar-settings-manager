import { setTimeout as delay } from 'node:timers/promises'
import type { Logger } from 'electron-log'
import type { Client, Server } from 'node-osc'
import type { OSCQueryService } from './OSCQueryService'
import type { OSCConnection, OSCReceiver, OSCStartupStatus } from '../types/osc'
import { oscQuery } from './oscQuery'
import { oscServer } from './oscServer'
import { oscClient } from './oscClient'
import { randomNumber } from '../helpers/randomNumber'

export async function startOSC(
  log: Logger,
  report: (status: OSCStartupStatus) => void,
  signal: AbortSignal,
  prepareReceiver: (client: Client) => Promise<OSCReceiver>
): Promise<OSCConnection | null> {
  let attempt = 0
  let previousPort: number | undefined

  while (!signal.aborted) {
    attempt++
    let query: OSCQueryService | undefined
    let server: Server | undefined
    let client: Client | undefined
    let receiver: OSCReceiver | undefined
    let stopping: Promise<void> | undefined

    const cleanup = async (): Promise<void> => {
      if (receiver) server?.off('message', receiver.handleMessage)

      const results = await Promise.allSettled([
        Promise.resolve().then(() => receiver?.stop()),
        Promise.resolve().then(() => client?.close()),
        new Promise<void>((resolve) => {
          if (!server) return resolve()
          server.close(resolve)
        }),
        Promise.resolve().then(() => query?.stop())
      ])

      for (const result of results) {
        if (result.status === 'rejected') {
          log.error('OSC cleanup failed:', result.reason)
        }
      }
    }

    const stop = (): Promise<void> => {
      stopping ??= cleanup()
      return stopping
    }

    try {
      report({ state: 'starting', attempt, message: 'Starting OSC listener...' })

      let port = randomNumber()

      while (port === previousPort) port = randomNumber()

      if (attempt === 1 && process.argv[2]?.startsWith('port=')) {
        port = parseInt(process.argv[2].slice(5), 10)
        log.info(`Using custom port from command line argument: ${port}`)
      }

      previousPort = port
      log.info(`Setting up OSC on port ${port} (attempt ${attempt})...`)
      server = await oscServer(log, port, signal)
      signal.throwIfAborted()
      client = oscClient(log)
      receiver = await prepareReceiver(client)

      signal.throwIfAborted()
      server.on('message', receiver.handleMessage)

      const started = await oscQuery(log, signal, port)
      query = started.service
      signal.throwIfAborted()

      log.info(`OSC setup complete (attempt ${attempt})`)

      return { query, server, client, stop }
    } catch (error) {
      await stop()

      if (signal.aborted) return null

      log.error(`OSC startup attempt ${attempt} failed:`, error)
      const message = `Could not start OSC. Retrying on a different port in 5 seconds (attempt ${attempt}).`
      log.info(message)

      report({ state: 'retrying', attempt, message })

      try {
        await delay(5000, undefined, { signal })
      } catch (waitError) {
        if (signal.aborted) return null
        throw waitError
      }
    }
  }

  return null
}
