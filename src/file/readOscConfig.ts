import path from 'node:path'
import fs from 'node:fs'
import { Logger } from 'electron-log'
import { lookForConfig } from './lookForConfig'
import { cleanJson } from '../helpers/cleanJson'
import { OscConfig } from '../services/resolveParameters'

export function readOscConfig(avatarId: string, log: Logger): OscConfig {
  const vrcPath = path.join(process.env.APPDATA!.replace('Roaming', 'LocalLow'), 'VRChat/VRChat')
  const file = lookForConfig(avatarId, vrcPath, log)
  if (!file) throw new Error('Current avatar OSC configuration not found')
  const config = JSON.parse(cleanJson(fs.readFileSync(path.join(vrcPath, 'OSC', file), 'utf8')))
  if (!Array.isArray(config.parameters)) throw new Error('Invalid avatar OSC configuration')
  return config
}
