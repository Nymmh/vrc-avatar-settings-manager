<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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

const appStore = appStorage()

const failedAvatarUpdates = ref<FailedOperation<string>[]>([])
const failedConfigUpdates = ref<FailedOperation[]>([])
const failedPresetUpdates = ref<FailedOperation[]>([])
const allAvatars = ref<Awaited<ReturnType<typeof window.avatarApi.getAllAvatars>>>([])
const allConfigs = ref<Awaited<ReturnType<typeof window.avatarApi.getConfigById>>>([])
const allPresets = ref<Awaited<ReturnType<typeof window.avatarApi.getPresetsByUqid>>>([])
const expandedAvatarRow = ref<string | null>(null)
const expandedConfigRow = ref<number | null>(null)
const searchAvatar = ref('')
const scrollContainer = ref<{ osInstance: () => OverlayScrollbars | null } | null>(null)
const avatarRefs = ref<(HTMLElement | null)[]>([])
const configRefs = ref<(HTMLElement | null)[]>([])
let cleanupDataTableRefresh: (() => void) | null = null

const hasConfigs = computed(() => allConfigs.value && allConfigs.value.length > 0)
const hasPresets = computed(() => allPresets.value?.length > 0)

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
      avatar.avatarId?.toLowerCase().includes(query) || avatar.name?.toLowerCase().includes(query)
    )
  })
})

const avatarIdWidths = computed(() => {
  return filteredAvatars.value.map((a) => Math.min((a.avatarId?.length || 10) * 9.4 + 40, 500))
})

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
  failedAvatarUpdates.value = []
  failedConfigUpdates.value = []
  failedPresetUpdates.value = []
  allAvatars.value = await window.avatarApi.getAllAvatars()
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
  const updatedAvatarId = avatar.avatarIdInput || avatar.avatarId

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

  getAvatars()
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

  if (res.success && config.avatarId) {
    await getConfigsByAvatar(config.avatarId)
  }
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

  if (res.success && config.avatarId) {
    await getConfigsByAvatar(config.avatarId)
  }
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
    await getConfigsByAvatar(preset.avatarId)
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
  cleanupDataTableRefresh?.()
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

const emit = defineEmits(['notification'])
</script>

<template>
  <div class="data-table">
    <OverlayScrollbarsComponent
      ref="scrollContainer"
      element="div"
      defer
      :options="{
        scrollbars: {
          autoHide: 'move',
          autoHideDelay: 300
        }
      }"
    >
      <div class="data-table__content">
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
        <div v-for="(a, idx) in filteredAvatars" :key="idx" class="data-table__avatar-wrapper">
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
                  label="Update"
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
              <Card v-for="(config, cIdx) in allConfigs" :key="cIdx">
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
                    <Button
                      v-if="config.id && appStore.avatarId"
                      label="Apply"
                      :small="true"
                      tooltip="Apply config"
                      :error="failedConfigSet.get(config.id)?.has('apply') ?? false"
                      @click="handleConfigApply(config.id)"
                    />
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
                      label="Update"
                      :small="true"
                      tooltip="Update config name & NSFW status"
                      :error="failedConfigSet.get(config.id)?.has('update') ?? false"
                      :warning="true"
                      @click="handleConfigUpdate(config.id)"
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
                    <Button
                      v-if="config.id"
                      label="Replace Params"
                      :small="true"
                      tooltip="Replace config parameters with ones from a file, must be a config file not an avatar file"
                      :error="failedConfigSet.get(config.id)?.has('replace') ?? false"
                      :warning="true"
                      @click="handleConfigReplace(config.id)"
                    />
                    <Button
                      v-if="config.id"
                      label="Delete"
                      :small="true"
                      :error="true"
                      tooltip="Delete config and all associated presets"
                      @click="handleConfigDelete(config.id)"
                    />
                  </div>

                  <div v-if="hasPresets && isConfigExpanded(cIdx)" class="data-table__presets">
                    <Card
                      v-for="(preset, pIdx) in allPresets"
                      v-show="preset.forUqid === config.uqid"
                      :key="pIdx"
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
    </OverlayScrollbarsComponent>
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

  &__content {
    align-items: center;
    display: flex;
    flex-flow: column;
    gap: 28px;
    height: 100%;
    padding-top: 22px;
    width: 100%;
  }

  &__avatar-wrapper {
    align-items: center;
    contain: layout style paint;
    content-visibility: auto;
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
    gap: 8px;
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

  &__config-title {
    font-size: 1.1rem;
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
    align-items: center;
    display: flex;
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
}
</style>
