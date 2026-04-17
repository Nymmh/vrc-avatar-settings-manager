import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import log from 'electron-log/main'
import { BrowserWindow } from 'electron'
import { Client } from 'node-osc'
import { ASMStorage } from '../../main/ASMStorage'
import { WebhookServer } from '../../webhooks/webhookServer'
import { registerTiplinkRoutes } from '../../webhooks/registerTiplinkRoutes'
import { createTestDb, seedTiplinkSettings } from '../helpers/testDb'
import { signWebhookPayload } from '../helpers/signWebhookPayload'

const mockedApplyModule = vi.hoisted(() => ({
  applyFromSavedForWebhook: vi.fn()
}))

vi.mock('../../ipc/applyFromSaved', () => ({
  applyFromSavedForWebhook: mockedApplyModule.applyFromSavedForWebhook
}))

describe('TipLink apply config endpoint', () => {
  beforeEach(() => {
    mockedApplyModule.applyFromSavedForWebhook.mockReset()
  })

  it('applies a saved config and returns success', async () => {
    const db = createTestDb()
    const storage = new ASMStorage()
    storage.setCurrentAvatarId('avtr_current')
    seedTiplinkSettings(db, 'current-secret')
    mockedApplyModule.applyFromSavedForWebhook.mockResolvedValue({
      success: true,
      msg: 'Saved config applied successfully'
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
      getMainWindow: () => ({}) as BrowserWindow,
      getOSCClient: () => ({}) as Client
    })

    const payload = { id: 55 }
    const response = await request(webhookServer.getApp())
      .post('/webhooks/tiplink/apply-config')
      .set('ASM-Signature', signWebhookPayload(payload, 'current-secret'))
      .send(payload)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      success: true,
      msg: 'Saved config applied successfully',
      data: {
        id: 55
      }
    })
    expect(mockedApplyModule.applyFromSavedForWebhook).toHaveBeenCalledOnce()

    db.close()
  })

  it('returns an error for invalid config ids', async () => {
    const db = createTestDb()
    const storage = new ASMStorage()
    storage.setCurrentAvatarId('avtr_current')
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
      getMainWindow: () => ({}) as BrowserWindow,
      getOSCClient: () => ({}) as Client
    })

    const payload = { id: 'bad-id' }
    const response = await request(webhookServer.getApp())
      .post('/webhooks/tiplink/apply-config')
      .set('ASM-Signature', signWebhookPayload(payload, 'current-secret'))
      .send(payload)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      success: false,
      msg: 'A valid saved config id is required'
    })

    db.close()
  })

  it('returns the apply failure message when remote apply is rejected', async () => {
    const db = createTestDb()
    const storage = new ASMStorage()
    storage.setCurrentAvatarId('avtr_current')
    seedTiplinkSettings(db, 'current-secret')
    mockedApplyModule.applyFromSavedForWebhook.mockResolvedValue({
      success: false,
      msg: 'Saved config belongs to a different avatar than the current avatar'
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
      getMainWindow: () => ({}) as BrowserWindow,
      getOSCClient: () => ({}) as Client
    })

    const payload = { configId: 72 }
    const response = await request(webhookServer.getApp())
      .post('/webhooks/tiplink/apply-config')
      .set('ASM-Signature', signWebhookPayload(payload, 'current-secret'))
      .send(payload)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      success: false,
      msg: 'Saved config belongs to a different avatar than the current avatar',
      data: {
        id: 72
      }
    })

    db.close()
  })
})
