import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { getSavedNamesForAvatar } from '../database/getSavedNames'
import { ASMStorage } from '../main/ASMStorage'
import { applyFromSavedForWebhook } from '../ipc/applyFromSaved'
import { WebhookServer } from './webhookServer'

interface RegisterTiplinkRoutesContext {
  log: Logger
  avatarDB: Database
  storage: ASMStorage
  getMainWindow: () => BrowserWindow | null
  getOSCClient: () => Client | null
}

interface ApplyConfigRequest {
  id?: unknown
  configId?: unknown
}

function normalizeConfigId(body: unknown): number | null {
  if (typeof body !== 'object' || body === null) {
    return null
  }

  const payload = body as ApplyConfigRequest
  const rawId = payload.id ?? payload.configId

  if (typeof rawId !== 'number' || !Number.isInteger(rawId) || rawId <= 0) {
    return null
  }

  return rawId
}

export function registerTiplinkRoutes(
  webhookServer: WebhookServer,
  context: RegisterTiplinkRoutesContext
): void {
  webhookServer.registerSignedRoute('tiplink/connect', async () => {
    return {
      success: true,
      msg: 'TipLink connection successful'
    }
  })

  webhookServer.registerSignedRoute('tiplink/saved-configs', async () => {
    const currentAvatarId = context.storage.getCurrentAvatarId()

    if (!currentAvatarId) {
      return {
        success: false,
        msg: 'No current avatar is loaded',
        statusCode: 400
      }
    }

    const savedConfigs = getSavedNamesForAvatar(context.log, context.avatarDB, currentAvatarId)

    return {
      success: true,
      msg:
        savedConfigs.length > 0
          ? 'Saved configs fetched successfully'
          : 'No saved configs for current avatar',
      data: {
        avatarId: currentAvatarId,
        configs: savedConfigs
      }
    }
  })

  webhookServer.registerSignedRoute('tiplink/apply-config', async (body: unknown) => {
    const configId = normalizeConfigId(body)
    if (configId === null) {
      return {
        success: false,
        msg: 'A valid saved config id is required',
        statusCode: 400
      }
    }

    const currentAvatarId = context.storage.getCurrentAvatarId()
    if (!currentAvatarId) {
      return {
        success: false,
        msg: 'No current avatar is loaded',
        statusCode: 400
      }
    }

    const mainWindow = context.getMainWindow()
    const oscClient = context.getOSCClient()
    if (!mainWindow || !oscClient) {
      return {
        success: false,
        msg: 'Required application dependencies are unavailable',
        statusCode: 503
      }
    }

    const result = await applyFromSavedForWebhook(
      context.log,
      context.avatarDB,
      configId,
      currentAvatarId,
      oscClient,
      mainWindow,
      context.storage
    )

    return {
      success: result.success,
      msg: result.msg,
      statusCode: result.success ? 200 : 400,
      data: {
        id: configId
      }
    }
  })
}
