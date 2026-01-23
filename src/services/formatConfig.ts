import Database from 'better-sqlite3'
import { getSaveFaceTrackingSetting } from '../database/getSaveFaceTrackingSetting'
import { Logger } from 'electron-log'
import { FT_EXCLUDED, FT_REGEX, VF_PREFIX_REGEX, isExcluded } from '../helpers/excludedParameters'

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

    const type = parameterMap.get(c.name)

    if (!type) return ap
    if (!value) value = 0

    const formattedName = c.name.replace(/ /g, '_')

    if (hasPendingChanges) {
      if (pendingChanges.has(formattedName)) {
        const pendingValue = pendingChanges.get(formattedName)
        value =
          typeof pendingValue === 'boolean'
            ? pendingValue
              ? 1
              : 0
            : (pendingValue as number | string)
      } else {
        const nameWithoutPrefixes = formattedName.replace(VF_PREFIX_REGEX, '')
        for (const [key, val] of pendingChanges.entries()) {
          const keyWithoutPrefixes = key.replace(VF_PREFIX_REGEX, '')
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

  log.info('Finished formatting config data')
  return formattedData
}
