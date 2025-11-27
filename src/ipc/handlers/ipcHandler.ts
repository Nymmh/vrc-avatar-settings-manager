import { BrowserWindow } from 'electron'
import { Logger } from 'electron-log'
import Database from 'better-sqlite3'
import { Client } from 'node-osc'
import { ASMStorage } from '../../main/ASMStorage'
import { appHandlers } from './appHandlers'
import { configHandlers } from './configHandlers'
import { presetHandlers } from './presetHandlers'
import { avatarHandlers } from './avatarHandlers'
import { exportHandlers } from './exportHandlers'

interface HandlerContext {
  log: Logger
  avatarDB: Database
  storage: ASMStorage
  getMainWindow: () => BrowserWindow | null
  getOSCClient: () => Client | null
}

export function ipcHandlers(context: HandlerContext): void {
  appHandlers()
  configHandlers(context)
  presetHandlers(context)
  avatarHandlers(context)
  exportHandlers(context)
}
