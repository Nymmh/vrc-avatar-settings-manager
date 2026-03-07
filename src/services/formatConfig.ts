import Database from 'better-sqlite3'
import { getSaveFaceTrackingSetting } from '../database/getSaveFaceTrackingSetting'
import { Logger } from 'electron-log'
import { FT_EXCLUDED, FT_REGEX, VF_PREFIX_REGEX, isExcluded } from '../helpers/excludedParameters'

const LIGHTING_VALUES = new Set<string>([
  'Min_Brightness',
  'Min Brightness',
  'Grayscale Lighting',
  'Grayscale_Lighting',
  'LightMultiplier',
  'Light Multiplier',
  'Light_Multiplier'
])

function normalizeName(name: string): string {
  return name.replace(/ +/g, '_').replace(/_+/g, '_')
}

function stripVFPrefix(name: string): string {
  return name.replace(VF_PREFIX_REGEX, '')
}

// Experimental.... but might fix the lighting issue, in some cases, poggies
function isLightingValue(name: string): boolean {
  const nameWithoutPrefixes = stripVFPrefix(name)
  const separatorIndex = nameWithoutPrefixes.lastIndexOf('/')
  const lastSegment =
    separatorIndex === -1 ? nameWithoutPrefixes : nameWithoutPrefixes.slice(separatorIndex + 1)
  return LIGHTING_VALUES.has(lastSegment)
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

  const parsedParameters = parsedConfig.parameters
  const hasPendingChanges = pendingChanges.size > 0
  const pendingChangesFormat = hasPendingChanges
    ? new Map(
        Array.from(pendingChanges.entries()).map(([key, value]) => [normalizeName(key), value])
      )
    : new Map<string, unknown>()

  const pendingChangesBySuffix = new Map<string, { key: string; value: unknown }>()
  if (hasPendingChanges) {
    for (const [key, value] of pendingChangesFormat.entries()) {
      const suffixName = stripVFPrefix(key)
      if (!pendingChangesBySuffix.has(suffixName)) {
        pendingChangesBySuffix.set(suffixName, { key, value })
      }
    }
  }

  const aviParamChangeCatch = new Set<string>()
  const cacheValueMap = new Map(parsedCache.animationParameters.map((p) => [p.name, p.value]))
  const saveFaceTrackingSetting = getSaveFaceTrackingSetting(db, log)
  const stripVFPrefixCache = new Map<string, string>()
  const lightingValueCache = new Map<string, boolean>()

  const getSuffixName = (name: string): string => {
    const cached = stripVFPrefixCache.get(name)
    if (cached !== undefined) return cached
    const value = stripVFPrefix(name)
    stripVFPrefixCache.set(name, value)
    return value
  }

  const isLightingName = (name: string): boolean => {
    const cached = lightingValueCache.get(name)
    if (cached !== undefined) return cached
    const value = isLightingValue(name)
    lightingValueCache.set(name, value)
    return value
  }

  const valuedParams: valuedParamsInterface[] = []

  for (let i = 0; i < parsedParameters.length; i++) {
    const c = parsedParameters[i]
    let value = cacheValueMap.get(c.name) ?? c.value

    if (isExcluded(c.name, true)) continue

    if (saveFaceTrackingSetting === false) {
      if (FT_EXCLUDED.has(c.name) || FT_REGEX.test(c.name)) {
        continue
      }
    }

    const type = c.input?.type === 'Float' ? 'f' : 'i'

    if (!type) continue
    if (!value && !isLightingName(c.name)) value = 0

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
        aviParamChangeCatch.add(formattedName)
      } else {
        const nameWithoutPrefixes = getSuffixName(formattedName)
        const suffixMatch = pendingChangesBySuffix.get(nameWithoutPrefixes)

        if (suffixMatch) {
          log.warn(
            `Applying pending change for ${formattedName} (matched ${suffixMatch.key} via suffix ${nameWithoutPrefixes})`
          )
          aviParamChangeCatch.add(formattedName)
          value =
            typeof suffixMatch.value === 'boolean'
              ? suffixMatch.value
                ? 1
                : 0
              : (suffixMatch.value as number | string)
        }
      }
    }

    valuedParams.push({
      name: formattedName,
      value,
      type
    })
  }

  formattedData.valuedParams = valuedParams

  if (aviParamChangeCatch.size > 0) {
    // This is to catch if new things where added to the avi or params shifted
    // Thank god Tamara found this bug

    if (Array.isArray(formattedData.valuedParams)) {
      for (let i = 0; i < formattedData.valuedParams.length; i++) {
        const param = formattedData.valuedParams[i]
        if (typeof param === 'string' || param.name === undefined) continue
        if (!aviParamChangeCatch.has(param.name)) {
          if (!isLightingName(param.name)) {
            log.warn(`Zeroing param ${param.name} due to suffix match`)
            param.value = 0
          }
        }
      }
    }
  }

  // This exists just for mega old legacy support, should be removed after a while
  if (formattedData.valuedParams && Array.isArray(formattedData.valuedParams)) {
    for (let i = 0; i < formattedData.valuedParams.length; i++) {
      if (formattedData.valuedParams[i].value === 'waiting') {
        formattedData.valuedParams[i].value = 0
      }
    }
  }

  cacheValueMap.clear()
  pendingChangesFormat.clear()
  pendingChangesBySuffix.clear()

  if (formattedData.valuedParams && formattedData.valuedParams.length > 0) {
    const noPrefixValueMap = new Map<string, valuedParamsInterface['value']>()
    const valuedParams = formattedData.valuedParams

    for (let i = 0; i < valuedParams.length; i++) {
      const p = valuedParams[i]
      if (typeof p === 'string' || p.name === undefined) continue
      const suffixName = getSuffixName(p.name)

      if (suffixName === p.name) {
        noPrefixValueMap.set(p.name, p.value)
      }
    }

    for (let i = 0; i < valuedParams.length; i++) {
      const p = valuedParams[i]
      if (typeof p === 'string' || p.name === undefined) continue
      const suffixName = getSuffixName(p.name)

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

  stripVFPrefixCache.clear()
  lightingValueCache.clear()

  log.info('Finished formatting config data')
  return formattedData
}
