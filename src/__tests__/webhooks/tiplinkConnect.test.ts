import { afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import log from 'electron-log/main'
import { ASMStorage } from '../../main/ASMStorage'
import { WebhookServer } from '../../webhooks/webhookServer'
import { registerTiplinkRoutes } from '../../webhooks/registerTiplinkRoutes'
import { createTestDb, seedTiplinkSettings } from '../helpers/testDb'
import { signWebhookPayload } from '../helpers/signWebhookPayload'

describe('TipLink connect endpoint', () => {
  afterEach(() => {
    log.transports.console.level = false
  })

  it('accepts a valid signature for the connect route', async () => {
    const db = createTestDb()
    const storage = new ASMStorage()
    seedTiplinkSettings(db, 'current-secret')

    const webhookServer = new WebhookServer(
      {
        port: 8711,
        secretProvider: () => ['current-secret']
      },
      log
    )

    registerTiplinkRoutes(webhookServer, {
      log,
      avatarDB: db as never,
      storage,
      getMainWindow: () => null,
      getOSCClient: () => null
    })

    const payload = {}
    const response = await request(webhookServer.getApp())
      .post('/webhooks/tiplink/connect')
      .set('ASM-Signature', signWebhookPayload(payload, 'current-secret'))
      .send(payload)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      success: true,
      msg: 'TipLink connection successful'
    })

    db.close()
  })

  it('accepts the previous secret during the grace window', async () => {
    const db = createTestDb()
    const storage = new ASMStorage()
    seedTiplinkSettings(db, 'current-secret')

    const webhookServer = new WebhookServer(
      {
        port: 8711,
        secretProvider: () => ['current-secret', 'previous-secret']
      },
      log
    )

    registerTiplinkRoutes(webhookServer, {
      log,
      avatarDB: db as never,
      storage,
      getMainWindow: () => null,
      getOSCClient: () => null
    })

    const payload = {}
    const response = await request(webhookServer.getApp())
      .post('/webhooks/tiplink/connect')
      .set('ASM-Signature', signWebhookPayload(payload, 'previous-secret'))
      .send(payload)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)

    db.close()
  })

  it('rejects an invalid signature', async () => {
    const db = createTestDb()
    const storage = new ASMStorage()
    seedTiplinkSettings(db, 'current-secret')

    const webhookServer = new WebhookServer(
      {
        port: 8711,
        secretProvider: () => ['current-secret']
      },
      log
    )

    registerTiplinkRoutes(webhookServer, {
      log,
      avatarDB: db as never,
      storage,
      getMainWindow: () => null,
      getOSCClient: () => null
    })

    const response = await request(webhookServer.getApp())
      .post('/webhooks/tiplink/connect')
      .set('ASM-Signature', 'sha256=invalid')
      .send({})

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)

    db.close()
  })
})
