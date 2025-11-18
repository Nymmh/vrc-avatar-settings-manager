import { animationParametersType, avatarConfigType } from '../types/avatarConfigType'

export function formatConfig(aviData: string, aviCache: string): avatarConfigType {
  const formattedData: avatarConfigType = {
    id: '',
    name: '',
    animationParameters: undefined
  }
  const avatarParameters: animationParametersType[] = []

  const parsedConfig: avatarConfigType = JSON.parse(aviData)
  const parsedCache: avatarConfigType = JSON.parse(aviCache)

  formattedData.name = parsedConfig.name
  formattedData.id = parsedConfig.id

  if (parsedCache.animationParameters?.length && parsedConfig.parameters?.length) {
    for (const c of parsedCache.animationParameters) {
      if (c.name == 'VRCEmote') continue
      else if (c.name == 'VRCFaceBlendH') continue
      else if (c.name == 'Go/Locomotion') continue
      else if (c.name == 'Go/Jump&Fall') continue
      else if (c.name == 'Go/StandIdle') continue
      else if (c.name == 'Go/CrouchIdle') continue
      else if (c.name == 'Go/ProneIdle') continue
      else if (c.name == 'EyeTrackingActive') continue
      else if (c.name == 'LipTrackingActive') continue
      else if (c.name == 'VisemesEnable') continue
      else if (c.name == 'FacialExpressionsDisabled') continue
      else if (c.name == 'State/TrackingActive') continue
      else if (c.name == 'Smoothing/Local') continue
      else if (c.value !== undefined) {
        for (const ap of parsedConfig.parameters) {
          if (ap.name === c.name) {
            avatarParameters.push({
              name: c.name,
              value: c.value,
              type: ap.input?.type == 'Float' ? 'f' : 'i'
            })
          }
        }
      }
    }
    formattedData.animationParameters = avatarParameters
  }

  return formattedData
}
