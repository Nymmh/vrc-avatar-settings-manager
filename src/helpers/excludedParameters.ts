const cache = new Set<string>()

export const BASE_EXCLUDED = new Set([
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

export const FT_EXCLUDED = new Set([
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

export const REGEX_EXCLUDED = [
  /\/LastSynced$/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]SyncData/,
  /^FT\/v2\//,
  /^VF[ _]?\d+(?:\.\d+)*[_/]SyncPointer$/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]TC_current/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]TC_FullControllerBuilder/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]TC_merged_trackingEyes$/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]TC_VRC[ _]Avatar[ _]Descriptor_trackingEyes$/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]timeSinceLoad$/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]counter$/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]ScaleFactor_b$/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]ScaleFactorDiff$/,
  /^VF[ _]\d+(?:\.\d+)*$/,
  /^VF_\d+(?:\.\d+)*[a-z]/,
  /^VF_\d+(?:\.\d+)*_One$/,
  /^VF_\d+(?:\.\d+)*_True$/,
  /^VFH\/Version/,
  /^VF[ _]?\d+(?:\.\d+)*[_/]FT\/Debug$/
]

export const FT_REGEX = /^VF[ _]\d+(?:\.\d+)*$/
export const VF_PREFIX_REGEX = /^VF[ _]?\d+(?:\.\d+)*[_/]/
export const ASM_PRESET_REGEX = /Nymh\/ASM\/Preset\//

export function isExcluded(payload: string, excludeASMPresets = false): boolean {
  if (cache.has(payload)) return true

  if (BASE_EXCLUDED.has(payload)) {
    cache.add(payload)
    return true
  }

  for (const pattern of REGEX_EXCLUDED) {
    if (pattern.test(payload)) {
      cache.add(payload)
      return true
    }
  }

  if (excludeASMPresets && ASM_PRESET_REGEX.test(payload)) {
    cache.add(payload)
    return true
  }

  return false
}
