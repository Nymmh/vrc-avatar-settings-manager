import { describe, expect, it } from 'vitest'
import request from 'supertest'
import log from 'electron-log/main'
import { ASMStorage } from '../../main/ASMStorage'
import { WebhookServer } from '../../webhooks/webhookServer'
import { registerTiplinkRoutes } from '../../webhooks/registerTiplinkRoutes'
import { createTestDb, insertSavedConfig, seedTiplinkSettings } from '../helpers/testDb'
import { signWebhookPayload } from '../helpers/signWebhookPayload'

describe('TipLink saved config list endpoint', () => {
  it('returns only id and name for the current avatar configs', async () => {
    const db = createTestDb()
    const storage = new ASMStorage()
    storage.setCurrentAvatarId('avtr_current')
    seedTiplinkSettings(db, 'current-secret')

    insertSavedConfig(db, {
      id: 11,
      uqid: 'uqid-1',
      avatarId: 'avtr_current',
      name: 'Street Outfit'
    })
    insertSavedConfig(db, {
      id: 12,
      uqid: 'uqid-2',
      avatarId: 'avtr_current',
      name: 'Club Outfit'
    })
    insertSavedConfig(db, {
      id: 99,
      uqid: 'uqid-3',
      avatarId: 'avtr_other',
      name: 'Should Not Be Returned'
    })

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
      .post('/webhooks/tiplink/saved-configs')
      .set('ASM-Signature', signWebhookPayload(payload, 'current-secret'))
      .send(payload)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      success: true,
      msg: 'Saved configs fetched successfully',
      data: {
        avatarId: 'avtr_current',
        configs: [
          { id: 11, name: 'Street Outfit' },
          { id: 12, name: 'Club Outfit' }
        ]
      }
    })

    db.close()
  })

  it('returns an error when no current avatar is loaded', async () => {
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
      .post('/webhooks/tiplink/saved-configs')
      .set('ASM-Signature', signWebhookPayload(payload, 'current-secret'))
      .send(payload)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      success: false,
      msg: 'No current avatar is loaded'
    })

    db.close()
  })
})
