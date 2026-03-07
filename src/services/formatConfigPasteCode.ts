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

export function formatConfigPasteCode(
  db: Database,
  aviData: string,
  aviCache: string,
  pendingChanges: Map<string, { value: number | string; type: string }>,
  log: Logger
): avatarDBInterface {
  log.info('Formatting config paste code')
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

  const pendingChangesFormat = new Map(
    Array.from(pendingChanges.entries()).map(([key, value]) => [normalizeName(key), value])
  )

  const pendingChangesBySuffix = new Map<
    string,
    { key: string; value: { value: number | string; type: string } }
  >()
  for (const [key, value] of pendingChangesFormat.entries()) {
    const suffixName = stripVFPrefix(key)
    if (!pendingChangesBySuffix.has(suffixName)) {
      pendingChangesBySuffix.set(suffixName, { key, value })
    }
  }

  const aviParamChangeCatch = new Set<string>()
  const cacheValueMap = new Map(parsedCache.animationParameters.map((p) => [p.name, p.value]))
  const lightingValueCache = new Map<string, boolean>()
  const stripVFPrefixCache = new Map<string, string>()
  const hasPendingChanges = pendingChanges.size > 0
  const saveFaceTrackingSetting = getSaveFaceTrackingSetting(db, log)

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
    value = 0

    const type = c.input?.type === 'Float' ? 'f' : 'i'

    if (!type) continue
    if (!value && !isLightingName(c.name)) value = 0

    const formattedName = normalizeName(c.name)

    if (hasPendingChanges) {
      if (pendingChangesFormat.has(formattedName)) {
        const pendingValue = pendingChangesFormat.get(formattedName)
        if (pendingValue !== undefined) {
          value = pendingValue.value as number | string
          aviParamChangeCatch.add(formattedName)
        }
      } else {
        const nameWithoutPrefixes = getSuffixName(formattedName)
        const suffixMatch = pendingChangesBySuffix.get(nameWithoutPrefixes)

        if (suffixMatch) {
          log.warn(
            `Applying pending change for ${formattedName} (matched ${suffixMatch.key} via suffix ${nameWithoutPrefixes})`
          )
          aviParamChangeCatch.add(formattedName)
          value = suffixMatch.value.value as number | string
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

  if (formattedData.valuedParams && Array.isArray(formattedData.valuedParams)) {
    for (let i = 0; i < formattedData.valuedParams.length; i++) {
      const p = formattedData.valuedParams[i]
      if (p.value === 'waiting') {
        p.value = 0
      }
    }
  }

  pendingChangesBySuffix.clear()
  stripVFPrefixCache.clear()
  pendingChangesFormat.clear()
  cacheValueMap.clear()
  lightingValueCache.clear()
  log.info('Finished formatting config paste code')
  return formattedData
}
