import Database from 'better-sqlite3'
import { getSaveFaceTrackingSetting } from '../database/getSaveFaceTrackingSetting'
import { Logger } from 'electron-log'
import { FT_EXCLUDED, FT_REGEX, isExcluded } from '../helpers/excludedParameters'

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

  const parameterMap = new Map(
    parsedConfig.parameters.map((pm) => [pm.name, pm.input?.type === 'Float' ? 'f' : 'i'])
  )

  const cacheValueMap = new Map(parsedCache.animationParameters.map((p) => [p.name, p.value]))

  const hasPendingChanges = pendingChanges.size > 0

  formattedData.valuedParams = parsedConfig.parameters.reduce((ap, c) => {
    let value = cacheValueMap.get(c.name) ?? c.value

    if (isExcluded(c.name, true)) return ap

    if (getSaveFaceTrackingSetting(db, log) === false) {
      if (FT_EXCLUDED.has(c.name) || FT_REGEX.test(c.name)) {
        return ap
      }
    }
    value = 0

    const type = parameterMap.get(c.name)

    if (!type) return ap
    if (!value) value = 0

    const formattedName = c.name.replace(/ /g, '_')

    if (hasPendingChanges) {
      if (pendingChanges.has(formattedName)) {
        const pendingValue = pendingChanges.get(formattedName)
        if (pendingValue !== undefined) {
          value = pendingValue.value as number | string
        }
      } else {
        const stripVFPrefixes = (str: string): string => {
          return str.replace(/^(?:VF\d+_)+/, '')
        }

        const nameWithoutPrefixes = stripVFPrefixes(formattedName)
        for (const [key, val] of pendingChanges.entries()) {
          const keyWithoutPrefixes = stripVFPrefixes(key)
          if (keyWithoutPrefixes === nameWithoutPrefixes) {
            log.warn(
              `Applying pending change for ${formattedName} (matched ${key} via suffix ${nameWithoutPrefixes})`
            )
            value = val.value as number | string
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
    formattedData.valuedParams = formattedData.valuedParams.map((p) => {
      if (p.value === 'waiting') {
        return {
          ...p,
          value: 0
        }
      }
      return p
    })
  }

  log.info('Finished formatting config data')
  return formattedData
}
