const PARAM_PREFIX = '/avatar/parameters/'
const ASM_PRESET_TOKEN = 'Nymh/ASM/Preset/'
const MAX_CACHE_SIZE = 4096

const cacheNoPreset = new Map<string, boolean>()
const cacheWithPreset = new Map<string, boolean>()

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
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]SyncIndex\d+$/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]TC_current_tracking/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]SyncData/,
  /^(?:\/avatar\/parameters\/)?FT\/v2\//,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]SyncPointer$/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]TC_current/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]TC_FullControllerBuilder/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]TC_merged_trackingEyes$/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]TC_VRC[ _]Avatar[ _]Descriptor_trackingEyes$/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]timeSinceLoad$/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]counter$/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]ScaleFactor_b$/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]ScaleFactorDiff$/,
  /^(?:\/avatar\/parameters\/)?VF[ _]\d+(?:\.\d+)*$/,
  /^(?:\/avatar\/parameters\/)?VF_\d+(?:\.\d+)*[a-z]/,
  /^(?:\/avatar\/parameters\/)?VF_\d+(?:\.\d+)*_One$/,
  /^(?:\/avatar\/parameters\/)?VF_\d+(?:\.\d+)*_True$/,
  /^(?:\/avatar\/parameters\/)?VFH\/Version/,
  /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]FT\/Debug$/,
  /^(?:\/avatar\/parameters\/)?FT\/Debug$/
]

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const FT_REGEX = /^(?:\/avatar\/parameters\/)?VF[ _]\d+(?:\.\d+)*$/
export const VF_PREFIX_REGEX = /^(?:\/avatar\/parameters\/)?VF[ _]?\d+(?:\.\d+)*[_/]/
export const BASE_REGEX_EXCLUDED = Array.from(
  BASE_EXCLUDED,
  (value) => new RegExp(`^(?:\\/avatar\\/parameters\\/)?${escapeRegex(value)}$`)
)

const getCache = (excludeASMPresets: boolean): Map<string, boolean> =>
  excludeASMPresets ? cacheWithPreset : cacheNoPreset

const setCache = (cache: Map<string, boolean>, payload: string, value: boolean): void => {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value
    if (oldestKey !== undefined) cache.delete(oldestKey)
  }

  cache.set(payload, value)
}

const normalizePayload = (payload: string): string =>
  payload.startsWith(PARAM_PREFIX) ? payload.slice(PARAM_PREFIX.length) : payload

const clearNonExcluded = (cache: Map<string, boolean>): void => {
  for (const [payload, isExcludedValue] of cache) {
    if (!isExcludedValue) {
      cache.delete(payload)
    }
  }
}

export function clearNonExcludedFromCache(): void {
  clearNonExcluded(cacheNoPreset)
  clearNonExcluded(cacheWithPreset)
}

export function isExcluded(payload: string, excludeASMPresets = false): boolean {
  const cache = getCache(excludeASMPresets)
  const cached = cache.get(payload)
  if (cached !== undefined) return cached

  const normalized = normalizePayload(payload)

  if (BASE_EXCLUDED.has(normalized)) {
    setCache(cache, payload, true)
    return true
  }

  if (excludeASMPresets && normalized.includes(ASM_PRESET_TOKEN)) {
    setCache(cache, payload, true)
    return true
  }

  const willRegex =
    normalized.endsWith('/LastSynced') ||
    normalized.startsWith('VF') ||
    normalized.startsWith('FT/') ||
    normalized.startsWith('VFH/')

  if (willRegex) {
    for (const pattern of REGEX_EXCLUDED) {
      if (pattern.test(normalized)) {
        setCache(cache, payload, true)
        return true
      }
    }
  }

  setCache(cache, payload, false)
  return false
}
