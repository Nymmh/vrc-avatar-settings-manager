<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { OverlayScrollbars } from 'overlayscrollbars'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
import Button from './Button.vue'
import Card from './Card.vue'
import LoadAvatarFile from './LoadAvatarFile.vue'
import InputCheckbox from './InputCheckbox.vue'
import InputText from './InputText.vue'
import InputNumber from './InputNumber.vue'
import { appStorage } from '../composables/appStorage'

type OpResult = { success: boolean; message?: string }
type FailedOperation<T = string | number> = { id: T; action: string }
type SavedConfig = NonNullable<Awaited<ReturnType<typeof window.avatarApi.getAllSaved>>>[number]
type Preset = NonNullable<Awaited<ReturnType<typeof window.avatarApi.getAllPresets>>>[number]

const appStore = appStorage()

const failedAvatarUpdates = ref<FailedOperation<string>[]>([])
const failedConfigUpdates = ref<FailedOperation[]>([])
const failedPresetUpdates = ref<FailedOperation[]>([])
const allAvatars = ref<Awaited<ReturnType<typeof window.avatarApi.getAllAvatars>>>([])
const allConfigs = ref<Awaited<ReturnType<typeof window.avatarApi.getConfigById>>>([])
const allPresets = ref<Awaited<ReturnType<typeof window.avatarApi.getPresetsByUqid>>>([])
const expandedAvatarRow = ref<string | null>(null)
const expandedConfigRow = ref<number | null>(null)
const expandedActionGroups = ref<Set<string>>(new Set())
const searchAvatar = ref('')
const selectedAvatarId = ref<string | null>(null)
const editedAvatarId = ref('')
const showManagement = ref(false)
const searchableConfigs = ref<SavedConfig[]>([])
const searchablePresets = ref<Preset[]>([])
const detailConfigs = computed(() =>
  searchableConfigs.value.filter((config) => {
    if (config.avatarId !== selectedAvatarId.value) return false
    const query = searchAvatar.value.trim().toLowerCase()
    if (!query) return true
    const avatar = allAvatars.value.find((entry) => entry.avatarId === selectedAvatarId.value)
    return [avatar?.name, avatar?.avatarId, config.name].some((value) =>
      value?.toLowerCase().includes(query)
    )
  })
)
const selectedAvatar = computed(() =>
  allAvatars.value.find((avatar) => avatar.avatarId === selectedAvatarId.value)
)
const renderedAvatarCount = ref(20)
const dataTableRoot = ref<HTMLElement | null>(null)
const scrollContainer = ref<{ osInstance: () => OverlayScrollbars | null } | null>(null)
const avatarRefs = ref<(HTMLElement | null)[]>([])
const configRefs = ref<(HTMLElement | null)[]>([])
let cleanupDataTableRefresh: (() => void) | null = null
let cleanupScrollListener: (() => void) | null = null
let currentScrollTarget: HTMLElement | null = null
let bindScrollRetryTimeout: ReturnType<typeof setTimeout> | null = null
const avatarRenderStep = 20

const dataTableScrollOverlayProps = {
  element: 'div',
  defer: true,
  options: {
    scrollbars: {
      autoHide: 'move',
      autoHideDelay: 300
    }
  }
}

const avatarLoadTriggerOffset = 800

const hasConfigs = computed(() => allConfigs.value && allConfigs.value.length > 0)
const hasPresets = computed(() => allPresets.value?.length > 0)

const getPresetsForConfig = (uqid: string): typeof allPresets.value => {
  if (!uqid) return []
  return allPresets.value.filter((preset) => preset.forUqid === uqid)
}

const failedAvatarSet = computed(() => {
  const map = new Map<string, Set<string>>()
  failedAvatarUpdates.value.forEach((f) => {
    if (!map.has(f.id)) map.set(f.id, new Set())
    map.get(f.id)!.add(f.action)
  })
  return map
})

const failedConfigSet = computed(() => {
  const map = new Map<string | number, Set<string>>()
  failedConfigUpdates.value.forEach((f) => {
    if (!map.has(f.id)) map.set(f.id, new Set())
    map.get(f.id)!.add(f.action)
  })
  return map
})

const failedPresetSet = computed(() => {
  const map = new Map<string | number, Set<string>>()
  failedPresetUpdates.value.forEach((f) => {
    if (!map.has(f.id)) map.set(f.id, new Set())
    map.get(f.id)!.add(f.action)
  })
  return map
})

const filteredAvatars = computed(() => {
  if (!searchAvatar.value.trim()) {
    return allAvatars.value
  }

  const query = searchAvatar.value.toLowerCase()
  return allAvatars.value.filter((avatar) => {
    return (
      avatar.avatarId?.toLowerCase().includes(query) ||
      avatar.name?.toLowerCase().includes(query) ||
      searchableConfigs.value.some(
        (config) =>
          config.avatarId === avatar.avatarId && config.name?.toLowerCase().includes(query)
      )
    )
  })
})

const visibleAvatars = computed(() => {
  return filteredAvatars.value.slice(0, renderedAvatarCount.value)
})

const hasMoreAvatars = computed(() => {
  return visibleAvatars.value.length < filteredAvatars.value.length
})

const avatarIdWidths = computed(() => {
  return visibleAvatars.value.map((a) => Math.min((a.avatarId?.length || 10) * 9.4 + 40, 500))
})

const resetAvatarRenderWindow = (): void => {
  renderedAvatarCount.value = avatarRenderStep
  avatarRefs.value = []
}

const loadMoreAvatars = (): void => {
  renderedAvatarCount.value += avatarRenderStep
}

const loadMoreAvatarsOnScroll = useDebounceFn((): void => {
  if (!currentScrollTarget || !hasMoreAvatars.value) {
    return
  }

  const remainingScroll =
    currentScrollTarget.scrollHeight -
    currentScrollTarget.scrollTop -
    currentScrollTarget.clientHeight

  if (remainingScroll < avatarLoadTriggerOffset) {
    loadMoreAvatars()
  }
}, 80)

const ensureScrollableContent = (): void => {
  if (!currentScrollTarget) {
    return
  }

  let guard = 0
  while (
    hasMoreAvatars.value &&
    currentScrollTarget.scrollHeight <= currentScrollTarget.clientHeight &&
    guard < 20
  ) {
    renderedAvatarCount.value += avatarRenderStep
    guard += 1
  }
}

const bindAvatarInfiniteScroll = async (): Promise<void> => {
  cleanupScrollListener?.()
  cleanupScrollListener = null
  currentScrollTarget = null
  if (bindScrollRetryTimeout) {
    clearTimeout(bindScrollRetryTimeout)
    bindScrollRetryTimeout = null
  }

  await nextTick()

  const target = appStore.value.lowPerformanceMode
    ? dataTableRoot.value
    : scrollContainer.value?.osInstance()?.elements().viewport || null

  if (!target) {
    if (!appStore.value.lowPerformanceMode) {
      bindScrollRetryTimeout = setTimeout(() => {
        bindAvatarInfiniteScroll()
      }, 200)
    }
    return
  }

  currentScrollTarget = target

  const onScroll = (): void => {
    loadMoreAvatarsOnScroll()
  }

  target.addEventListener('scroll', onScroll, { passive: true })
  cleanupScrollListener = () => {
    target.removeEventListener('scroll', onScroll)
  }

  ensureScrollableContent()
}

const clearFailed = <T,>(array: FailedOperation<T>[], id: T): void => {
  const idx = array.findIndex((item) => item.id === id)
  if (idx > -1) array.splice(idx, 1)
}

const addFailed = <T,>(array: FailedOperation<T>[], id: T, action: string): void => {
  array.push({ id, action })
}

const pushNotification = (result: OpResult, successTitle: string, errorTitle: string): void => {
  emit('notification', {
    type: result.success ? 'success' : 'error',
    title: result.success ? successTitle : errorTitle,
    text: result.message
  })
}

const handleOperation = <T,>(
  result: OpResult,
  successTitle: string,
  errorTitle: string,
  id: T,
  action: string,
  failedArray: FailedOperation<T>[]
): void => {
  clearFailed(failedArray, id)

  if (!result.success) {
    addFailed(failedArray, id, action)
  }

  pushNotification(result, successTitle, errorTitle)
}

const resetExpandedState = (): void => {
  expandedAvatarRow.value = null
  expandedConfigRow.value = null
  allConfigs.value = []
  allPresets.value = []
}

const getAvatars = async (): Promise<void> => {
  resetExpandedState()
  resetAvatarRenderWindow()
  failedAvatarUpdates.value = []
  failedConfigUpdates.value = []
  failedPresetUpdates.value = []
  allAvatars.value = await window.avatarApi.getAllAvatars()
  searchableConfigs.value = (await window.avatarApi.getAllSaved()) || []
  searchablePresets.value = (await window.avatarApi.getAllPresets()) || []
  if (!allAvatars.value.some((avatar) => avatar.avatarId === selectedAvatarId.value)) {
    selectedAvatarId.value = allAvatars.value[0]?.avatarId || null
  }
  if (selectedAvatarId.value) {
    allConfigs.value = searchableConfigs.value.filter(
      (config) => config.avatarId === selectedAvatarId.value
    )
    allPresets.value = searchablePresets.value.filter(
      (preset) => preset.avatarId === selectedAvatarId.value
    )
    editedAvatarId.value = selectedAvatarId.value
  }
}

const selectAvatar = (avatarId: string): void => {
  selectedAvatarId.value = avatarId
  editedAvatarId.value = avatarId
  allConfigs.value = searchableConfigs.value.filter((config) => config.avatarId === avatarId)
  allPresets.value = searchablePresets.value.filter((preset) => preset.avatarId === avatarId)
}

const applyDetailConfig = async (config: SavedConfig): Promise<void> => {
  if (!config.id) return
  const result = await window.avatarApi.applyConfig(config.id)
  pushNotification(result, 'Preset applied', 'Preset application failed')
}

const deleteDetailConfig = async (config: SavedConfig): Promise<void> => {
  if (!config.id) return
  const result = await window.avatarApi.deleteConfig(config.id)
  pushNotification(result, 'Preset deleted', 'Delete failed')
  if (result.success) await getAvatars()
}

const getConfigsByAvatar = async (avatarId: string): Promise<void> => {
  expandedConfigRow.value = null
  allConfigs.value = []
  allPresets.value = []
  allConfigs.value = await window.avatarApi.getConfigById(avatarId)
}

const getPresetsByConfig = async (idx: number): Promise<void> => {
  const uqid = allConfigs.value?.[idx]?.uqid

  if (!uqid) {
    emit('notification', {
      type: 'error',
      title: 'Preset ID missing'
    })
    return
  }

  allPresets.value = []
  allPresets.value = await window.avatarApi.getPresetsByUqid(uqid)
}

const isAvatarExpanded = (aviId: string): boolean => expandedAvatarRow.value === aviId
const isConfigExpanded = (idx: number): boolean => expandedConfigRow.value === idx
const isActionGroupExpanded = (group: string): boolean => expandedActionGroups.value.has(group)
const toggleAvatar = (aviId: string, idx: number): void => {
  if (expandedAvatarRow.value === aviId) {
    expandedAvatarRow.value = null
    allConfigs.value = []
  } else {
    expandedAvatarRow.value = aviId
    getConfigsByAvatar(expandedAvatarRow.value)

    setTimeout(() => {
      const el = avatarRefs.value[idx]
      const osInstance = scrollContainer.value?.osInstance?.()
      if (el && osInstance) {
        const viewport = osInstance.elements().viewport
        const containerRect = viewport.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const scrollTop = viewport.scrollTop
        const targetScroll = scrollTop + elRect.top - containerRect.top - 44
        viewport.scrollTo({ top: targetScroll, behavior: 'smooth' })
      } else if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }
}

const toggleConfig = (idx: number): void => {
  if (expandedConfigRow.value === idx) {
    expandedConfigRow.value = null
    allPresets.value = []
  } else {
    expandedConfigRow.value = idx
    getPresetsByConfig(idx)

    setTimeout(() => {
      const el = configRefs.value[idx]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }
}

const toggleActionGroup = (group: string): void => {
  if (expandedActionGroups.value.has(group)) {
    expandedActionGroups.value.delete(group)
  } else {
    expandedActionGroups.value.add(group)
  }
}

const validateAvatarName = (name: string): string | null => {
  if (!name || name.trim() === '') {
    return 'Avatar name cannot be empty.'
  }
  return null
}

const validatePreset = (preset: (typeof allPresets.value)[0]): string | null => {
  if (!preset.name || preset.name.trim() === '') {
    return 'Preset name cannot be empty.'
  }
  if (!preset.unityParameter || isNaN(preset.unityParameter)) {
    return 'Unity parameter must be a valid number.'
  }
  if (preset.unityParameter <= 0) {
    return 'Unity parameter must be greater than zero.'
  }
  return null
}

const handleAvatarUpdate = async (avatarId: string): Promise<void> => {
  const avatar = allAvatars.value.find((a) => a.avatarId === avatarId) as unknown as {
    avatarId: string
    avatarIdInput?: string
    name: string
  }
  const updatedAvatarId = editedAvatarId.value || avatar.avatarId

  clearFailed(failedAvatarUpdates.value, avatarId)

  const validationError = validateAvatarName(avatar.name)
  if (validationError) {
    addFailed(failedAvatarUpdates.value, avatarId, 'update')
    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: validationError
    })
    return
  }

  const res = await window.avatarApi.updateAvatarData(avatarId, avatar.name, updatedAvatarId)
  handleOperation(
    res,
    'Update Successful',
    'Update Failed',
    avatarId,
    'update',
    failedAvatarUpdates.value
  )

  if (res.success) await getAvatars()
}

const handleAvatarExport = async (avatarId: string): Promise<void> => {
  const res = await window.avatarApi.exportAvatar(avatarId)
  handleOperation(
    res,
    'Export Successful',
    'Export Failed',
    avatarId,
    'export',
    failedAvatarUpdates.value
  )
}

const handleAvatarDelete = async (avatarId: string): Promise<void> => {
  const res = await window.avatarApi.deleteAvatar(avatarId)

  handleOperation(
    res,
    'Delete Successful',
    'Delete Failed',
    avatarId,
    'delete',
    failedAvatarUpdates.value
  )

  if (res.success) {
    allAvatars.value = allAvatars.value.filter((a) => a.avatarId !== avatarId)
    await getAvatars()
  }
}

const handleConfigApply = async (configId: number): Promise<void> => {
  const res = await window.avatarApi.applyConfig(configId)
  handleOperation(
    res,
    'Apply Successful',
    'Apply Failed',
    configId,
    'apply',
    failedConfigUpdates.value
  )
}

const handleConfigExport = async (configId: number): Promise<void> => {
  const res = await window.avatarApi.exportConfig(configId)
  handleOperation(
    res,
    'Export Successful',
    'Export Failed',
    configId,
    'export',
    failedConfigUpdates.value
  )
}

const handleConfigUpdate = async (configId: number): Promise<void> => {
  if (!allConfigs.value) return

  const config = allConfigs.value.find((c) => c.id === configId)
  if (!config) return

  if (!configId) {
    addFailed(failedConfigUpdates.value, 0, 'update')
    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'ID not valid.'
    })
    return
  }

  const res = await window.avatarApi.updateConfigData(
    configId,
    config.avatarId || 'Unknown',
    config.name,
    Boolean(config.nsfw)
  )

  handleOperation(
    res,
    'Update Successful',
    'Update Failed',
    configId,
    'update',
    failedConfigUpdates.value
  )
  if (res.success) await getAvatars()
}

const handleCreatePreset = async (configId: number): Promise<void> => {
  if (!allConfigs.value) return

  const config = allConfigs.value.find((c) => c.id === configId)
  if (!config) return
  if (!configId) {
    addFailed(failedConfigUpdates.value, 0, 'createPreset')
    emit('notification', {
      type: 'error',
      title: 'Create Preset Failed',
      text: 'ID not valid.'
    })
    return
  }

  const res = await window.avatarApi.createPresetFromApp(configId)
  handleOperation(
    res,
    'Create Preset Successful',
    'Create Preset Failed',
    configId,
    'createPreset',
    failedConfigUpdates.value
  )

  if (res.success) await getAvatars()
}

const handleConfigReplace = async (configId: number): Promise<void> => {
  if (!allConfigs.value) return

  const config = allConfigs.value.find((c) => c.id === configId)
  if (!config) return
  const res = await window.avatarApi.replaceParams(configId)
  handleOperation(
    res,
    'Replace Params Successful',
    'Replace Params Failed',
    configId,
    'replace',
    failedConfigUpdates.value
  )

  if (res.success) await getAvatars()
}

const handleConfigDelete = async (configId: number): Promise<void> => {
  if (!allConfigs.value) return

  const config = allConfigs.value.find((c) => c.id === configId)
  if (!config) return

  const res = await window.avatarApi.deleteConfig(configId)

  handleOperation(
    res,
    'Delete Successful',
    'Delete Failed',
    configId,
    'delete',
    failedConfigUpdates.value
  )

  if (res.success) {
    const index = allConfigs.value.findIndex((c) => c.id === configId)
    if (index !== -1) {
      allConfigs.value.splice(index, 1)
    }
    await getAvatars()
  }
}

const handlePresetApply = async (presetId: number): Promise<void> => {
  const preset = allPresets.value.find((p) => p.id === presetId)
  const res = await window.avatarApi.applyPresetFromApp(preset.avatarId, preset.unityParameter)

  handleOperation(
    { success: Boolean(res), message: '' },
    'Apply Successful',
    'Apply Failed',
    preset.id,
    'apply',
    failedPresetUpdates.value
  )
}

const handlePresetUpdate = async (presetId: number): Promise<void> => {
  const preset = allPresets.value.find((p) => p.id === presetId)
  clearFailed(failedPresetUpdates.value, preset.id)

  const validationError = validatePreset(preset)
  if (validationError) {
    addFailed(failedPresetUpdates.value, preset.id, 'update')
    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: validationError
    })
    return
  }

  const res = await window.avatarApi.updatePresetFromApp(
    preset.id,
    preset.name,
    preset.unityParameter
  )
  handleOperation(
    res,
    'Update Successful',
    'Update Failed',
    preset.id,
    'update',
    failedPresetUpdates.value
  )
  if (res.success) await getAvatars()
}

const handlePresetDelete = async (presetId: number): Promise<void> => {
  const preset = allPresets.value.find((p) => p.id === presetId)
  const res = await window.avatarApi.deletePresetFromApp(preset.id)

  handleOperation(
    res,
    'Delete Successful',
    'Delete Failed',
    preset.id,
    'delete',
    failedPresetUpdates.value
  )

  if (res.success) {
    await getAvatars()
  }
}

const updateAvatarField = useDebounceFn((avatarId: string, field: string, value: unknown) => {
  const avatar = allAvatars.value.find((a) => a.avatarId === avatarId)
  if (avatar) {
    avatar[field] = value
  }
}, 300)

const updateConfigField = (configId: number, field: string, value: unknown): void => {
  if (allConfigs.value) {
    const config = allConfigs.value.find((c) => c.id === configId)
    if (config) {
      config[field] = value
    }
  }
}

const updatePresetField = (presetId: number, field: string, value: unknown): void => {
  if (allPresets.value) {
    const preset = allPresets.value.find((p) => p.id === presetId)
    if (preset) {
      preset[field] = value
    }
  }
}

const handleSearchUpdate = ({ value }: { value: string }): void => {
  searchAvatar.value = value
}

const refreshListen = (): void => {
  cleanupDataTableRefresh = window.avatarApi.dataTableRefresh(() => {
    getAvatars()
  })
}

onMounted(() => {
  getAvatars()
  refreshListen()
})

onUnmounted(() => {
  allAvatars.value = []
  allConfigs.value = []
  allPresets.value = []
  failedAvatarUpdates.value = []
  failedConfigUpdates.value = []
  failedPresetUpdates.value = []
  expandedActionGroups.value.clear()
  cleanupDataTableRefresh?.()
  cleanupScrollListener?.()
  cleanupScrollListener = null
  currentScrollTarget = null
  if (bindScrollRetryTimeout) {
    clearTimeout(bindScrollRetryTimeout)
    bindScrollRetryTimeout = null
  }
})

watch(
  () => appStore.value.dataTableRefresh,
  (newVal) => {
    if (newVal) {
      getAvatars()
      appStore.value.dataTableRefresh = false
    }
  }
)

watch(
  () => filteredAvatars.value.length,
  () => {
    if (!filteredAvatars.value.some((avatar) => avatar.avatarId === selectedAvatarId.value)) {
      const firstId = filteredAvatars.value[0]?.avatarId
      if (firstId) selectAvatar(firstId)
      else selectedAvatarId.value = null
    }
    resetAvatarRenderWindow()
    nextTick(() => {
      if (showManagement.value) {
        ensureScrollableContent()
        bindAvatarInfiniteScroll()
      }
    })
  }
)

watch(searchAvatar, () => {
  if (!filteredAvatars.value.some((avatar) => avatar.avatarId === selectedAvatarId.value)) {
    const firstId = filteredAvatars.value[0]?.avatarId
    if (firstId) selectAvatar(firstId)
    else selectedAvatarId.value = null
  }
})

watch(
  () => appStore.value.lowPerformanceMode,
  () => {
    if (showManagement.value) bindAvatarInfiniteScroll()
  }
)

watch(showManagement, (open) => {
  if (open) {
    void bindAvatarInfiniteScroll()
  } else {
    cleanupScrollListener?.()
    cleanupScrollListener = null
    currentScrollTarget = null
    if (bindScrollRetryTimeout) {
      clearTimeout(bindScrollRetryTimeout)
      bindScrollRetryTimeout = null
    }
  }
})

const emit = defineEmits(['notification'])
</script>

<template>
  <div
    ref="dataTableRoot"
    :class="['data-table', { 'data-table--low-performance': appStore.lowPerformanceMode }]"
  >
    <div v-if="!showManagement" class="data-browser">
      <div class="data-browser__header">
        <div>
          <p class="data-browser__eyebrow">Library</p>
          <h1>All Data</h1>
        </div>
        <label class="data-browser__search">
          <span class="sr-only">Search avatars, configurations, and presets</span>
          <input v-model="searchAvatar" type="search" placeholder="Search saved data" />
        </label>
      </div>
      <div class="data-browser__body">
        <div class="data-browser__avatars">
          <p class="data-browser__caption">
            Saved avatars <span>{{ filteredAvatars.length }}</span>
          </p>
          <div class="data-browser__avatar-list">
            <button
              v-for="avatar in filteredAvatars"
              :key="avatar.avatarId"
              class="data-browser__avatar"
              :class="{ 'is-selected': selectedAvatarId === avatar.avatarId }"
              @click="selectAvatar(avatar.avatarId)"
            >
              <span>{{ avatar.name || 'Unnamed avatar' }}</span
              ><span aria-hidden="true">›</span>
            </button>
            <p v-if="!filteredAvatars.length" class="data-browser__empty">
              No saved avatars match your search.
            </p>
          </div>
        </div>
        <div class="data-browser__detail">
          <template v-if="selectedAvatar">
            <div class="data-browser__detail-head">
              <div>
                <p class="data-browser__eyebrow">Selected avatar</p>
                <h2>{{ selectedAvatar.name }}</h2>
                <p class="data-browser__avatar-id">{{ selectedAvatar.avatarId }}</p>
              </div>
            </div>
            <p class="data-browser__caption">
              Presets <span>{{ detailConfigs.length }}</span>
            </p>
            <div class="data-browser__preset-list">
              <div v-for="config in detailConfigs" :key="config.id" class="data-browser__preset">
                <div>
                  <strong>{{ config.name }}</strong>
                </div>
                <div class="data-browser__preset-actions">
                  <button v-if="appStore.avatarId" @click="applyDetailConfig(config)">Apply</button>
                  <button class="data-browser__delete" @click="deleteDetailConfig(config)">
                    Delete
                  </button>
                </div>
              </div>
              <p v-if="!detailConfigs.length" class="data-browser__empty">
                No presets for this avatar{{ searchAvatar ? ' match your search' : '' }}. Saved
                configurations are available below.
              </p>
            </div>
            <details class="data-browser__tools">
              <summary>Avatar and configuration tools</summary>
              <div class="data-browser__tool-group">
                <label>Avatar name <input v-model="selectedAvatar.name" type="text" /></label>
                <label>Avatar ID <input v-model="editedAvatarId" type="text" /></label>
                <div class="data-browser__tool-actions">
                  <button
                    class="data-browser__warning"
                    @click="handleAvatarUpdate(selectedAvatar.avatarId)"
                  >
                    Save changes
                  </button>
                  <button @click="handleAvatarExport(selectedAvatar.avatarId)">
                    Export avatar
                  </button>
                  <button
                    class="data-browser__delete"
                    @click="handleAvatarDelete(selectedAvatar.avatarId)"
                  >
                    Delete avatar
                  </button>
                </div>
              </div>
              <p class="data-browser__caption">
                Saved configurations <span>{{ allConfigs?.length || 0 }}</span>
              </p>
              <details
                v-for="config in allConfigs || []"
                :key="config.id"
                class="data-browser__tool-group"
              >
                <summary>{{ config.name }}</summary>
                <label>Configuration name <input v-model="config.name" type="text" /></label>
                <label class="data-browser__checkbox"
                  >NSFW <input v-model="config.nsfw" type="checkbox"
                /></label>
                <p class="data-browser__caption">From file: {{ config.fromFile ? 'Yes' : 'No' }}</p>
                <div class="data-browser__tool-actions">
                  <button v-if="appStore.avatarId" @click="handleConfigApply(config.id!)">
                    Apply
                  </button>
                  <button @click="handleConfigExport(config.id!)">Export</button>
                  <button v-if="!config.isPreset" @click="handleCreatePreset(config.id!)">
                    Create preset
                  </button>
                  <button class="data-browser__warning" @click="handleConfigUpdate(config.id!)">
                    Save changes
                  </button>
                  <button class="data-browser__warning" @click="handleConfigReplace(config.id!)">
                    Replace params from file
                  </button>
                  <button class="data-browser__delete" @click="handleConfigDelete(config.id!)">
                    Delete config
                  </button>
                </div>
                <div
                  v-for="preset in allPresets.filter((entry) => entry.forUqid === config.uqid)"
                  :key="preset.id"
                  class="data-browser__tool-group"
                >
                  <label>Preset name <input v-model="preset.name" type="text" /></label>
                  <label
                    >Slot <input v-model.number="preset.unityParameter" type="number" min="1"
                  /></label>
                  <div class="data-browser__tool-actions">
                    <button class="data-browser__warning" @click="handlePresetUpdate(preset.id!)">
                      Update preset details
                    </button>
                  </div>
                </div>
              </details>
            </details>
          </template>
          <p v-else class="data-browser__empty">Select an avatar to see its presets.</p>
        </div>
      </div>
      <div class="data-browser__footer">
        <LoadAvatarFile @uploaded="getAvatars" @notification="$emit('notification', $event)" />
      </div>
    </div>
    <component
      :is="appStore.lowPerformanceMode ? 'div' : OverlayScrollbarsComponent"
      v-else
      ref="scrollContainer"
      v-bind="appStore.lowPerformanceMode ? {} : dataTableScrollOverlayProps"
    >
      <div class="data-table__content">
        <button class="data-browser__back" @click="showManagement = false">
          ← Back to avatars
        </button>
        <Card>
          <LoadAvatarFile @uploaded="getAvatars" @notification="$emit('notification', $event)" />
        </Card>
        <Card>
          <InputText
            id="avatar-search"
            :model-value="searchAvatar"
            label="Search Avatars: "
            placeholder="Search by ID or Name..."
            @update:model-value="handleSearchUpdate"
          />
        </Card>
        <div
          v-for="(a, idx) in visibleAvatars"
          :key="a.avatarId || `avatar-${idx}`"
          class="data-table__avatar-wrapper"
        >
          <Card>
            <div :ref="(el) => (avatarRefs[idx] = el as HTMLElement)" class="data-table__avatar">
              <div class="data-table__avatar-header">
                <button
                  v-if="a.avatarId"
                  :class="[
                    'data-table__expand-button',
                    { 'data-table__expand-button--expanded': isAvatarExpanded(a.avatarId) }
                  ]"
                  @click="toggleAvatar(a.avatarId, idx)"
                >
                  <svg
                    width="23"
                    height="23"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                  </svg>
                </button>
                <div class="data-table__avatar-info">
                  <p class="data-table__avatar-label">Avatar ID:</p>
                  <div
                    :style="{
                      width: `${avatarIdWidths[idx]}px`,
                      maxWidth: '500px'
                    }"
                  >
                    <InputText
                      :id="`avatarId-${idx}`"
                      :model-value="a.avatarId"
                      @update:model-value="
                        updateAvatarField(a.avatarId, 'avatarIdInput', $event.value)
                      "
                    />
                  </div>
                </div>
              </div>

              <div class="data-table__avatar-field">
                <label class="data-table__avatar-label">Avatar Name: </label>
                <InputText
                  :id="`avatarName-${idx}`"
                  :model-value="a.name"
                  @update:model-value="updateAvatarField(a.avatarId, 'name', $event.value)"
                />
              </div>

              <div class="data-table__avatar-actions">
                <Button
                  label="Save Changes"
                  :small="true"
                  :error="failedAvatarSet.get(a.avatarId)?.has('update') ?? false"
                  :warning="true"
                  tooltip="Update the Avatar ID and Name"
                  @click="handleAvatarUpdate(a.avatarId)"
                />
                <Button
                  label="Export"
                  :small="true"
                  :error="failedAvatarSet.get(a.avatarId)?.has('export') ?? false"
                  tooltip="Export avatar and all associated data to file"
                  @click="handleAvatarExport(a.avatarId)"
                />
                <Button
                  label="Delete"
                  :small="true"
                  :error="true"
                  tooltip="Delete avatar and all associated data"
                  @click="handleAvatarDelete(a.avatarId)"
                />
              </div>
            </div>
            <div v-if="isAvatarExpanded(a.avatarId) && hasConfigs" class="data-table__configs">
              <Card v-for="(config, cIdx) in allConfigs" :key="config.id || `config-${cIdx}`">
                <div
                  :ref="(el) => (configRefs[cIdx] = el as HTMLElement)"
                  class="data-table__config"
                >
                  <div class="data-table__config-header">
                    <button
                      v-if="config.isPreset"
                      :class="[
                        'data-table__expand-button',
                        { 'data-table__expand-button--expanded': isConfigExpanded(cIdx) }
                      ]"
                      @click="toggleConfig(cIdx)"
                    >
                      <svg
                        width="23"
                        height="23"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                      </svg>
                    </button>
                    <h3 class="data-table__config-title">Config</h3>
                  </div>

                  <div class="data-table__config-fields">
                    <div class="data-table__config-field">
                      <label class="data-table__config-label">Name: </label>
                      <InputText
                        v-if="config.id"
                        :id="`configName-${cIdx}`"
                        :model-value="config.name"
                        @update:model-value="updateConfigField(config.id, 'name', $event.value)"
                      />
                    </div>

                    <div class="data-table__config-field">
                      <InputCheckbox
                        v-if="config.id"
                        :id="`configNsfw-${cIdx}`"
                        :model-value="config.nsfw ? true : false"
                        label="NSFW: "
                        @update:model-value="updateConfigField(config.id, 'nsfw', $event.checked)"
                      />
                    </div>

                    <div class="data-table__config-field data-table__config-field--from-file">
                      <label class="data-table__config-label">From File: </label>
                      <p class="data-table__config-value">{{ config.fromFile ? 'Yes' : 'No' }}</p>
                    </div>
                  </div>
                  <div class="data-table__config-actions">
                    <div class="data-table__config-actions-header">
                      <button
                        v-if="a.avatarId"
                        :class="[
                          'data-table__expand-button',
                          {
                            'data-table__expand-button--expanded': isActionGroupExpanded(
                              `${a.avatarId}_${cIdx}_PA`
                            )
                          }
                        ]"
                        @click="toggleActionGroup(`${a.avatarId}_${cIdx}_PA`)"
                      >
                        <svg
                          width="23"
                          height="23"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6l4 4 4-4"
                            stroke="currentColor"
                            stroke-width="2"
                            fill="none"
                          />
                        </svg>
                      </button>
                      <h4 class="data-table__config-button-header">Main</h4>
                    </div>
                    <Card v-if="isActionGroupExpanded(`${a.avatarId}_${cIdx}_PA`)">
                      <div class="data-table__config-actions-groups">
                        <Button
                          v-if="config.id && appStore.avatarId"
                          label="Apply"
                          :small="true"
                          tooltip="Apply config"
                          :error="failedConfigSet.get(config.id)?.has('apply') ?? false"
                          @click="handleConfigApply(config.id)"
                        />
                        <Button
                          v-if="!config.isPreset && config.id"
                          label="Create Preset"
                          :small="true"
                          :hero="true"
                          tooltip="Create a new preset for this config"
                          :error="failedConfigSet.get(config.id)?.has('createPreset') ?? false"
                          @click="handleCreatePreset(config.id)"
                        />
                      </div>
                    </Card>
                    <div class="data-table__config-actions-header">
                      <button
                        v-if="a.avatarId"
                        :class="[
                          'data-table__expand-button',
                          {
                            'data-table__expand-button--expanded': isActionGroupExpanded(
                              `${a.avatarId}_${cIdx}_U`
                            )
                          }
                        ]"
                        @click="toggleActionGroup(`${a.avatarId}_${cIdx}_U`)"
                      >
                        <svg
                          width="23"
                          height="23"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6l4 4 4-4"
                            stroke="currentColor"
                            stroke-width="2"
                            fill="none"
                          />
                        </svg>
                      </button>
                      <h4 class="data-table__config-button-header">Utility</h4>
                    </div>
                    <Card v-if="isActionGroupExpanded(`${a.avatarId}_${cIdx}_U`)">
                      <div class="data-table__config-actions-groups">
                        <Button
                          v-if="config.id"
                          label="Export"
                          :small="true"
                          tooltip="Export config and associated preset(optional) to file"
                          :error="failedConfigSet.get(config.id)?.has('export') ?? false"
                          @click="handleConfigExport(config.id)"
                        />
                        <Button
                          v-if="config.id"
                          label="Save Changes"
                          :small="true"
                          tooltip="Update config name & NSFW status"
                          :error="failedConfigSet.get(config.id)?.has('update') ?? false"
                          :warning="true"
                          @click="handleConfigUpdate(config.id)"
                        />
                        <Button
                          v-if="config.id"
                          label="Replace Params"
                          :small="true"
                          tooltip="Replace config parameters with ones from a file, must be a config file not an avatar file"
                          :error="failedConfigSet.get(config.id)?.has('replace') ?? false"
                          :warning="true"
                          @click="handleConfigReplace(config.id)"
                        />
                      </div>
                    </Card>
                    <div class="data-table__config-actions-header">
                      <button
                        v-if="a.avatarId"
                        :class="[
                          'data-table__expand-button',
                          {
                            'data-table__expand-button--expanded': isActionGroupExpanded(
                              `${a.avatarId}_${cIdx}_D`
                            )
                          }
                        ]"
                        @click="toggleActionGroup(`${a.avatarId}_${cIdx}_D`)"
                      >
                        <svg
                          width="23"
                          height="23"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6l4 4 4-4"
                            stroke="currentColor"
                            stroke-width="2"
                            fill="none"
                          />
                        </svg>
                      </button>
                      <h4 class="data-table__config-button-header">Destructive</h4>
                    </div>
                    <Card v-if="isActionGroupExpanded(`${a.avatarId}_${cIdx}_D`)">
                      <div class="data-table__config-actions-groups">
                        <Button
                          v-if="config.id"
                          label="Delete"
                          :small="true"
                          :error="true"
                          tooltip="Delete config and all associated presets"
                          @click="handleConfigDelete(config.id)"
                        />
                      </div>
                    </Card>
                  </div>

                  <div v-if="hasPresets && isConfigExpanded(cIdx)" class="data-table__presets">
                    <Card
                      v-for="(preset, pIdx) in getPresetsForConfig(config.uqid || '')"
                      :key="preset.id || `preset-${pIdx}`"
                    >
                      <div class="data-table__preset">
                        <h4 class="data-table__preset-title">Preset</h4>

                        <div class="data-table__preset-fields">
                          <div class="data-table__preset-field">
                            <label class="data-table__preset-label">Name: </label>
                            <InputText
                              :id="`presetName-${pIdx}`"
                              :model-value="preset.name"
                              @update:model-value="
                                updatePresetField(preset.id, 'name', $event.value)
                              "
                            />
                          </div>

                          <div class="data-table__preset-field">
                            <label class="data-table__preset-label">Parameter: </label>
                            <InputNumber
                              :id="`presetParameter-${pIdx}`"
                              :model-value="preset.unityParameter"
                              @update:model-value="
                                updatePresetField(preset.id, 'unityParameter', $event.value)
                              "
                            />
                          </div>
                        </div>

                        <div class="data-table__preset-actions">
                          <Button
                            v-if="appStore.avatarId"
                            label="Apply"
                            :small="true"
                            tooltip="Apply preset"
                            :error="failedPresetSet.get(preset.id)?.has('apply') ?? false"
                            @click="handlePresetApply(preset.id)"
                          />
                          <Button
                            label="Update"
                            :small="true"
                            tooltip="Update preset name & parameter"
                            :error="failedPresetSet.get(preset.id)?.has('update') ?? false"
                            :warning="true"
                            @click="handlePresetUpdate(preset.id)"
                          />
                          <Button
                            label="Delete"
                            :small="true"
                            tooltip="Delete preset"
                            :error="true"
                            @click="handlePresetDelete(preset.id)"
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </div>
    </component>
  </div>
</template>

<style lang="scss" scoped>
.data-table {
  display: flex;
  flex-flow: column;
  gap: 28px;
  height: 100%;
  overflow: hidden;
  width: 100%;

  &--low-performance {
    overflow: auto;
  }

  &__content {
    align-items: center;
    display: flex;
    flex-flow: column;
    gap: 28px;
    height: 100%;
    padding-bottom: 22px;
    padding-top: 22px;
    width: 100%;
  }

  &__avatar-wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-bottom: 16px;
    width: 100%;

    &:is(:last-child) {
      padding-bottom: 22px;
    }
  }

  &__avatar {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
    width: 100%;
  }

  &__avatar-header {
    align-items: flex-start;
    display: flex;
    gap: 12px;
    justify-self: flex-start;
  }

  &__avatar-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__avatar-label {
    color: var(--color--primary-a2);
    font-size: 0.9rem;
    font-weight: 600;
  }

  &__avatar-value {
    font-weight: 700;
  }

  &__avatar-field {
    align-items: center;
    display: flex;
    gap: 12px;
  }

  &__avatar-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
  }

  &__configs {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
    width: calc(100% - 32px);

    :deep(.card) {
      width: 100%;
    }
  }

  &__config {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
  }

  &__config-header {
    align-items: center;
    display: flex;
    gap: 12px;
    right: 15px;
    position: relative;
  }

  &__config-actions-header {
    align-items: flex-start;
    display: flex;
    gap: 12px;
    right: 15px;
    position: relative;
  }

  &__config-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  &__config-button-header {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  &__config-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__config-field {
    align-items: center;
    display: flex;
    gap: 8px;
  }

  &__config-label {
    color: var(--color--primary-a2);
  }

  &__config-value {
    font-weight: 700;
  }

  &__config-actions {
    align-items: flex-start;
    display: flex;
    flex-flow: column;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
  }

  &__config-actions-groups {
    align-items: center;
    display: flex;
    flex-flow: row;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
  }

  &__presets {
    align-items: center;
    display: flex;
    flex-direction: column;
    margin-top: 20px;
    width: calc(100% - 24px);
  }

  &__preset {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  &__preset-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  &__preset-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__preset-field {
    align-items: center;
    display: flex;
    gap: 12px;
  }

  &__preset-label {
    color: var(--color--primary-a2);
  }

  &__preset-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
  }

  &__expand-button {
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    height: 30px;
    justify-content: center;
    margin-top: -5px;
    transform: rotate(-90deg);
    transition: transform 0.2s;
    width: 30px;
    will-change: transform;

    &--expanded {
      transform: rotate(0deg);
    }

    svg {
      pointer-events: none;
    }
  }

  &__load-more-hint {
    font-size: 0.9rem;
    opacity: 0.8;
    text-align: center;
  }
}

.data-browser {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: clamp(18px, 3vw, 30px);
  border-radius: 23px;
  background: var(--asm-panel);
  color: var(--asm-text);

  &__header,
  &__detail-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 18px;
  }

  &__header {
    align-items: center;
    margin-bottom: 20px;
  }
  &__header h1,
  &__detail-head h2 {
    display: block;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  &__detail-head h2 {
    font-size: 1.25rem;
  }
  &__eyebrow {
    margin: 0 0 7px;
    color: var(--asm-muted);
    font-size: 0.75rem;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  &__search {
    min-width: min(100%, 230px);
  }
  &__search input {
    width: 100%;
    min-height: 40px;
    padding: 8px 13px;
    border: 1px solid var(--color--card-glass-border);
    border-radius: 12px;
    background: var(--asm-control);
    color: var(--asm-text);
  }
  &__search input::placeholder {
    color: var(--asm-muted);
  }
  &__search input:focus,
  &__tool-group input:focus {
    outline: 1px solid var(--color--primary-a3);
  }
  &__body {
    display: grid;
    grid-template-columns: minmax(170px, 32%) minmax(0, 1fr);
    gap: clamp(16px, 3vw, 34px);
    flex: 1;
    min-height: 0;
  }
  &__avatars,
  &__detail {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  &__caption {
    display: flex;
    justify-content: space-between;
    margin: 0 0 12px;
    color: var(--asm-muted);
    font-size: 0.82rem;
  }
  &__avatar-list {
    display: grid;
    align-content: start;
    gap: 14px;
    overflow-y: auto;
    min-height: 0;
    padding-right: 10px;
    scrollbar-color: var(--color--secondary-a1) var(--asm-panel);
  }
  &__avatar-list::-webkit-scrollbar,
  &__preset-list::-webkit-scrollbar {
    width: 10px;
  }
  &__avatar-list::-webkit-scrollbar-thumb,
  &__preset-list::-webkit-scrollbar-thumb {
    border-radius: 8px;
    background: var(--color--secondary-a1);
  }
  &__avatar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 58px;
    width: 100%;
    gap: 10px;
    padding: 10px 16px;
    border: 0;
    border-radius: 17px;
    background: var(--asm-control);
    color: var(--asm-text);
    text-align: left;
    box-shadow: 0 3px 6px #0002;
  }
  &__avatar:hover {
    background: var(--asm-control-hover);
  }
  &__avatar.is-selected {
    background: var(--asm-selected);
  }
  &__avatar span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__avatar span:last-child {
    font-size: 1.5rem;
    line-height: 1;
  }
  &__detail {
    padding: clamp(18px, 2vw, 26px);
    border-radius: 18px;
    background: var(--color--low-card-glass-bg);
    border: 1px solid var(--color--card-glass-border);
  }
  &__detail-head {
    margin-bottom: 24px;
  }
  &__avatar-id {
    margin: 7px 0 0;
    color: var(--asm-muted);
    font-size: 0.77rem;
    overflow-wrap: anywhere;
  }
  &__manage,
  &__back,
  &__preset-actions button {
    padding: 8px 11px;
    border: 0;
    border-radius: 10px;
    background: var(--color--low-button);
    color: var(--asm-text);
    white-space: nowrap;
  }
  &__manage:hover,
  &__back:hover,
  &__preset-actions button:hover {
    background: var(--color--low-button-hover);
  }
  &__preset-list {
    display: grid;
    align-content: start;
    gap: 10px;
    overflow-y: auto;
    min-height: 0;
  }
  &__detail {
    overflow-y: auto;
    scrollbar-color: var(--color--secondary-a1) var(--asm-panel);
  }
  &__preset-list {
    max-height: min(36vh, 350px);
    flex: 0 1 auto;
    scrollbar-color: var(--color--secondary-a1) var(--asm-panel);
  }
  &__tools {
    margin-top: 16px;
    border-top: 1px solid var(--color--card-glass-border);
    padding-top: 14px;
  }
  &__tools > summary,
  &__tool-group > summary {
    cursor: pointer;
    color: var(--asm-text);
  }
  &__tool-group {
    display: grid;
    gap: 10px;
    margin: 14px 0;
    padding: 14px;
    border-radius: 12px;
    background: var(--color--card-glass-bg);
  }
  &__tool-group label {
    display: grid;
    gap: 5px;
    color: var(--asm-muted);
    font-size: 0.85rem;
  }
  &__tool-group input {
    width: 100%;
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid var(--color--card-glass-border);
    border-radius: 8px;
    background: var(--asm-control);
    color: var(--asm-text);
  }
  &__tool-group .data-browser__checkbox {
    display: flex;
    align-items: center;
  }
  &__checkbox input {
    width: auto;
  }
  &__tool-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  &__tool-actions button {
    padding: 8px 11px;
    border: 0;
    border-radius: 10px;
    background: var(--color--low-button);
    color: var(--asm-text);
  }
  &__tool-actions .data-browser__warning {
    background: var(--color--low-warning);
  }
  &__tool-actions .data-browser__delete {
    background: var(--color--low-error);
  }
  &__tool-actions button:hover {
    background: var(--color--low-button-hover);
  }
  &__tool-actions .data-browser__warning:hover {
    background: var(--color--low-warning-hover);
  }
  &__tool-actions .data-browser__delete:hover,
  &__preset-actions .data-browser__delete:hover {
    background: var(--color--low-error-hover);
  }
  &__tool-actions button:active,
  &__preset-actions button:active,
  &__avatar:active {
    filter: brightness(0.85);
  }
  &__preset {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
    padding: 14px;
    border-radius: 13px;
    background: var(--color--card-glass-bg);
    border: 1px solid var(--color--card-glass-border);
  }
  &__preset > div:first-child {
    display: grid;
    gap: 5px;
    min-width: 0;
  }
  &__preset strong {
    font-weight: 600;
  }
  &__preset span {
    color: var(--asm-muted);
    font-size: 0.8rem;
  }
  &__preset-actions {
    display: flex;
    gap: 7px;
  }
  &__preset-actions .data-browser__delete {
    background: var(--asm-danger);
  }
  &__empty {
    color: var(--asm-muted);
    line-height: 1.5;
  }
  &__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
  &__footer :deep(.load-avatar-file) {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  &__footer :deep(.button__wrapper) {
    background: var(--color--low-button);
    border-radius: 12px;
  }
  &__footer :deep(.button__wrapper:hover) {
    background: var(--color--low-button-hover);
  }
  &__back {
    align-self: flex-start;
    margin-bottom: 8px;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 800px) {
  .data-browser__body {
    grid-template-columns: minmax(125px, 38%) minmax(0, 1fr);
    gap: 12px;
  }
  .data-browser__detail {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .data-browser__body {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(130px, 30%) minmax(0, 1fr);
  }
  .data-browser__avatar-list {
    gap: 6px;
  }
  .data-browser__avatar {
    min-height: 42px;
  }
}
</style>
