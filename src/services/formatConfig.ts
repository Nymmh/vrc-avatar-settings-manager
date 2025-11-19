import { avatarConfigType } from '../types/avatarConfigType'

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
  pendingChanges: Map<string, any>
): avatarConfigType {
  const parsedConfig = JSON.parse(aviData)
  const parsedCache = JSON.parse(aviCache)

  const formattedData: avatarConfigType = {
    id: parsedConfig.id || '',
    name: parsedConfig.name || '',
    animationParameters: []
  }

  if (Array.isArray(parsedCache.animationParameters) && Array.isArray(parsedConfig.parameters)) {
    formattedData.animationParameters = parsedCache.animationParameters
      .filter((c) => !EXCLUDED_NAMES.has(c.name) && c.value !== undefined)
      .map((c) => {
        const ap = parsedConfig.parameters.find((ap) => ap.name === c.name)
        if (!ap) return null
        return {
          name: c.name,
          value: c.value,
          type: ap.input?.type === 'Float' ? 'f' : 'i'
        }
      })
      .filter(Boolean)
  }

  if (!formattedData.animationParameters || !pendingChanges.size) {
    return formattedData
  }

  formattedData.animationParameters.forEach((fd) => {
    if (fd.name !== undefined && pendingChanges.has(fd.name)) {
      let nv = pendingChanges.get(fd.name)
      if (typeof nv === 'boolean') {
        nv = nv ? 1 : 0
      }
      fd.value = nv
    }
  })

  return formattedData
}
