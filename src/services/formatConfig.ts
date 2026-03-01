import Database from 'better-sqlite3'
import { getSaveFaceTrackingSetting } from '../database/getSaveFaceTrackingSetting'
import { Logger } from 'electron-log'
import { FT_EXCLUDED, FT_REGEX, VF_PREFIX_REGEX, isExcluded } from '../helpers/excludedParameters'

function normalizeName(name: string): string {
  return name.replace(/ +/g, '_').replace(/_+/g, '_')
}

function stripVFPrefix(name: string): string {
  return name.replace(VF_PREFIX_REGEX, '')
}

export function formatConfig(
  db: Database,
  aviData: string,
  aviCache: string,
  pendingChanges: Map<string, unknown>,
  log: Logger
): avatarDBInterface {
  log.info('Formatting config data')
  const parsedConfig = JSON.parse(aviData)
  const parsedCache = JSON.parse(aviCache)

  const formattedData: avatarDBInterface = {
    avatarId: parsedConfig.id || '',
    name: parsedConfig.name || '',
    valuedParams: []
  }

  if (!Array.isArray(parsedCache.animationParameters) || !Array.isArray(parsedConfig.parameters))
    return formattedData

  const hasPendingChanges = pendingChanges.size > 0

  const pendingChangesFormat = hasPendingChanges
    ? new Map(
        Array.from(pendingChanges.entries()).map(([key, value]) => [normalizeName(key), value])
      )
    : new Map<string, unknown>()

  const parameterMap = new Map(
    parsedConfig.parameters.map((pm) => [pm.name, pm.input?.type === 'Float' ? 'f' : 'i'])
  )

  const cacheValueMap = new Map(parsedCache.animationParameters.map((p) => [p.name, p.value]))
  const saveFaceTrackingSetting = getSaveFaceTrackingSetting(db, log)

  formattedData.valuedParams = parsedConfig.parameters.reduce((ap, c) => {
    let value = cacheValueMap.get(c.name) ?? c.value

    if (isExcluded(c.name, true)) return ap

    if (saveFaceTrackingSetting === false) {
      if (FT_EXCLUDED.has(c.name) || FT_REGEX.test(c.name)) {
        return ap
      }
    }

    const type = parameterMap.get(c.name)

    if (!type) return ap
    if (!value) value = 0

    const formattedName = normalizeName(c.name)

    if (hasPendingChanges) {
      if (pendingChangesFormat.has(formattedName)) {
        const pendingValue = pendingChangesFormat.get(formattedName)
        value =
          typeof pendingValue === 'boolean'
            ? pendingValue
              ? 1
              : 0
            : (pendingValue as number | string)
      } else {
        const nameWithoutPrefixes = stripVFPrefix(formattedName)
        for (const [key, val] of pendingChangesFormat.entries()) {
          const keyWithoutPrefixes = stripVFPrefix(key)
          if (keyWithoutPrefixes === nameWithoutPrefixes) {
            log.warn(
              `Applying pending change for ${formattedName} (matched ${key} via suffix ${nameWithoutPrefixes})`
            )
            value = typeof val === 'boolean' ? (val ? 1 : 0) : (val as number | string)
            break
          }
        }
      }
    }

    ap.push({
      name: formattedName,
      value,
      type
    })

    return ap
  }, [] as valuedParamsInterface[])

  if (formattedData.valuedParams && Array.isArray(formattedData.valuedParams)) {
    for (let i = 0; i < formattedData.valuedParams.length; i++) {
      if (formattedData.valuedParams[i].value === 'waiting') {
        formattedData.valuedParams[i].value = 0
      }
    }
  }

  parameterMap.clear()
  cacheValueMap.clear()
  pendingChangesFormat.clear()

  if (formattedData.valuedParams && formattedData.valuedParams.length > 0) {
    const noPrefixValueMap = new Map<string, valuedParamsInterface['value']>()
    const valuedParams = formattedData.valuedParams

    for (let i = 0; i < valuedParams.length; i++) {
      const p = valuedParams[i]
      if (typeof p === 'string' || p.name === undefined) continue
      const suffixName = stripVFPrefix(p.name)

      if (suffixName === p.name) {
        noPrefixValueMap.set(p.name, p.value)
      }
    }

    for (let i = 0; i < valuedParams.length; i++) {
      const p = valuedParams[i]
      if (typeof p === 'string' || p.name === undefined) continue
      const suffixName = stripVFPrefix(p.name)

      if (suffixName === p.name || !noPrefixValueMap.has(suffixName)) {
        continue
      }

      const syncedValue = noPrefixValueMap.get(suffixName)

      if (syncedValue !== p.value) {
        log.warn(`Syncing param ${p.name} (matched ${suffixName} via suffix ${suffixName})`)
        p.value = syncedValue
      }
    }
  }

  log.info('Finished formatting config data')
  return formattedData
}
