const EXCLUDED_NAMES = new Set([
  'VRCEmote',
  'VRCFaceBlendH',
  'Go/Locomotion',
  'Go/Jump&Fall',
  'Go/StandIdle',
  'Go/CrouchIdle',
  'Go/ProneIdle',
  'EyeTrackingActive',
  'LipTrackingActive',
  'VisemesEnable',
  'FacialExpressionsDisabled',
  'State/TrackingActive',
  'Smoothing/Local'
])

export function formatConfig(
  aviData: string,
  aviCache: string,
  pendingChanges: Map<string, unknown>
): avatarConfigInterface {
  const parsedConfig = JSON.parse(aviData)
  const parsedCache = JSON.parse(aviCache)

  const formattedData: avatarConfigInterface = {
    id: parsedConfig.id || '',
    name: parsedConfig.name || '',
    animationParameters: []
  }

  if (!Array.isArray(parsedCache.animationParameters) || !Array.isArray(parsedConfig.parameters))
    return formattedData

  const parameterMap = new Map(
    parsedConfig.parameters.map((pm) => [pm.name, pm.input?.type === 'Float' ? 'f' : 'i'])
  )

  const hasPendingChanges = pendingChanges.size > 0

  formattedData.animationParameters = parsedCache.animationParameters.reduce((ap, c) => {
    if (!EXCLUDED_NAMES.has(c.name) && c.value !== undefined) return ap

    const type = parameterMap.get(c.name)

    if (!type) return ap

    let value = c.value

    if (hasPendingChanges && pendingChanges.has(c.name)) {
      const pendingValue = pendingChanges.get(c.name)
      value = typeof pendingValue === 'boolean' ? (pendingValue ? 1 : 0) : pendingValue
    }

    ap.push({
      name: c.name,
      value,
      type
    })

    return ap
  }, [] as animationParametersInterface[])

  return formattedData
}
