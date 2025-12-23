import Database from 'better-sqlite3'
import { getSaveFaceTrackingSetting } from '../database/getSaveFaceTrackingSetting'
import { Logger } from 'electron-log'

const EXCLUDED_NAMES = new Set([
  'VRCEmote',
  'VRCFaceBlendH',
  'VRCFaceBlendV',
  'VelocityX',
  'VelocityY',
  'VelocityZ',
  'VelocityMagnitude',
  'VelocityYFactor',
  'VelocitySmooth',
  'AngularY',
  'Grounded',
  'AFK',
  'Upright',
  'TrackingType',
  'VRMode',
  'VRModeProxy',
  'TrackingType',
  'IsLocal',
  'MuteSelf',
  'Voice',
  'Earmuffs',
  'ScaleFactor',
  'ScaleFactorInverse',
  'ScaleModified',
  'EyeHeightAsPercent',
  'EyeHeightAsMeters',
  'IsOnFriendsList',
  'IsAnimatorEnabled',
  'Viseme',
  'GestureLeft',
  'GestureRight',
  'GestureLeftWeight',
  'GestureRightWeight',
  'Seated',
  'InStation',
  'PreviewMode',
  'AvatarVersion',
  'GroundProximity',
  'Go/VRCEmote',
  'Go/Locomotion',
  'Go/Jump&Fall',
  'Go/StandIdle',
  'Go/CrouchIdle',
  'Go/ProneIdle',
  'Go/StandType',
  'Go/StandIdleMirror',
  'Go/CrouchIdleMirror',
  'Go/ProneIdleMirror',
  'Go/Dash',
  'Go/DashDistance',
  'Go/Dash/Right/FistWeight',
  'Go/JSRF/Timer',
  'Go/TrackingTypeProxy',
  'Go/VRModeProxy',
  'Go/Float',
  'Go/FloatEnd',
  'Go/FloatFactor',
  'Go/FloatSmooth',
  'Go/FloatSave',
  'Go/JSRF/ReadyToGrind',
  'Go/Jump',
  'Go/HipDriftZ',
  'Go/HipDriftX',
  'Go/HipDriftY',
  'Go/PuppetX',
  'Go/PuppetY',
  'Go/Action',
  'Go/Mirror',
  'Go/SVRB/Grounded',
  'Go/UprightMobile',
  'Go/Head',
  'Go/Prone',
  'Go/Crouch',
  'Go/PosePlaySpace',
  'Go/Pose',
  'Go/DashDirection',
  'Go/Stationary',
  'Go/CrouchType',
  'Go/ProneType',
  'Go/LaydownIdle',
  'Go/Swimming',
  'Go/Weight',
  'Go/PoseRadial',
  'Go/PoseRadialFactor',
  'Go/PoseRadialSmooth',
  'Go/Height',
  'Go/HeightFactor',
  'Go/HeightSmooth',
  'Go/Station/Chair',
  'FT/Debug'
])

const FT_EXCLUDED_NAMES = new Set([
  'EyeTrackingActive',
  'LipTrackingActive',
  'EyeDilationEnable',
  'FacialExpressionsDisabled',
  'VisemesEnable',
  'State/VisemesEnable',
  'State/TrackingActive',
  'RemoteModeActive',
  'Smoothing/Local',
  'FaceTrackingEmulation',
  'FaceTrackingLimits',
  'FT/EyeSync',
  'FT/EyeSyncMix'
])

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
    let value = cacheValueMap.get(c.name) ?? 'waiting'

    if (
      EXCLUDED_NAMES.has(c.name) ||
      value === undefined ||
      /\/LastSynced$/.test(c.name) ||
      /^FT\/v2\//.test(c.name) ||
      /Nymh\/ASM\/Preset\//.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]SyncData/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]SyncPointer$/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]TC_current/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]TC_FullControllerBuilder/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]TC_merged_trackingEyes$/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]TC_VRC[ _]Avatar[ _]Descriptor_trackingEyes$/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]timeSinceLoad$/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]counter$/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]ScaleFactor_b$/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]ScaleFactorDiff$/.test(c.name) ||
      /^VF[ _]\d+(?:\.\d+)*$/.test(c.name) ||
      /^VF_\d+(?:\.\d+)*[a-z]/.test(c.name) ||
      /^VF_\d+(?:\.\d+)*_One$/.test(c.name) ||
      /^VF_\d+(?:\.\d+)*_True$/.test(c.name) ||
      /^VFH\/Version/.test(c.name) ||
      /^VF[ _]?\d+(?:\.\d+)*[_/]FT\/Debug$/.test(c.name)
    )
      return ap

    if (getSaveFaceTrackingSetting(db) === false) {
      if (FT_EXCLUDED_NAMES.has(c.name) || /^VF[ _]\d+(?:\.\d+)*$/.test(c.name)) {
        return ap
      }
    }

    const type = parameterMap.get(c.name)

    if (!type) return ap

    const formattedName = c.name.replace(/ /g, '_')

    if (hasPendingChanges && pendingChanges.has(formattedName)) {
      const pendingValue = pendingChanges.get(formattedName)
      value =
        typeof pendingValue === 'boolean'
          ? pendingValue
            ? 1
            : 0
          : (pendingValue as number | string)
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
