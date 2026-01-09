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

const hasConfigs = computed(() => allConfigs.value && allConfigs.value.length > 0)
const hasPresets = computed(() => allPresets.value?.length > 0)

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

const handleAvatarUpdate = async (idx: number): Promise<void> => {
  const avatar = allAvatars.value[idx] as unknown as {
    avatarId: string
    avatarIdInput?: string
    name: string
  }
  const avatarId = avatar.avatarId
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

const handleAvatarExport = async (idx: number): Promise<void> => {
  const avatarId = allAvatars.value[idx].avatarId
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

const handleAvatarDelete = async (idx: number): Promise<void> => {
  const avatarId = allAvatars.value[idx].avatarId
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
    allAvatars.value.splice(idx, 1)
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

const handleConfigUpdate = async (idx: number): Promise<void> => {
  if (!allConfigs.value) return

  const config = allConfigs.value[idx]
  const configId = config.id

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

const handleCreatePreset = async (idx: number): Promise<void> => {
  if (!allConfigs.value) return

  const config = allConfigs.value[idx]
  const configId = config.id

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

const handleConfigReplace = async (idx: number): Promise<void> => {
  if (!allConfigs.value) return

  const config = allConfigs.value[idx]
  const configId = config.id!

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

const handleConfigDelete = async (idx: number): Promise<void> => {
  if (!allConfigs.value) return

  const configId = allConfigs.value[idx].id!
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
    allConfigs.value.splice(idx, 1)
  }
}

const handlePresetApply = async (idx: number): Promise<void> => {
  const preset = allPresets.value[idx]
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

const handlePresetUpdate = async (idx: number): Promise<void> => {
  const preset = allPresets.value[idx]

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

const handlePresetDelete = async (idx: number): Promise<void> => {
  const preset = allPresets.value[idx]
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

const updateAvatarField = useDebounceFn((idx: number, field: string, value: unknown) => {
  if (allAvatars.value[idx]) {
    allAvatars.value[idx][field] = value
  }
}, 300)

const updateConfigField = (idx: number, field: string, value: unknown): void => {
  if (allConfigs.value && allConfigs.value[idx]) {
    allConfigs.value[idx][field] = value
  }
}

const updatePresetField = (idx: number, field: string, value: unknown): void => {
  if (allPresets.value[idx]) {
    allPresets.value[idx][field] = value
  }
}

const handleSearchUpdate = ({ value }: { value: string }): void => {
  searchAvatar.value = value
}

const refreshListen = async (): Promise<void> => {
  await window.avatarApi.dataTableRefresh(() => {
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
                      width: `${Math.min((a.avatarId?.length || 10) * 9.4 + 40, 500)}px`,
                      maxWidth: '500px'
                    }"
                  >
                    <InputText
                      :id="`avatarId-${idx}`"
                      :model-value="a.avatarId"
                      @update:model-value="updateAvatarField(idx, 'avatarIdInput', $event.value)"
                    />
                  </div>
                </div>
              </div>

              <div class="data-table__avatar-field">
                <label class="data-table__avatar-label">Avatar Name: </label>
                <InputText
                  :id="`avatarName-${idx}`"
                  :model-value="a.name"
                  @update:model-value="updateAvatarField(idx, 'name', $event.value)"
                />
              </div>

              <div class="data-table__avatar-actions">
                <Button
                  label="Update"
                  :small="true"
                  :error="
                    failedAvatarUpdates.some((fu) => fu.id === a.avatarId && fu.action === 'update')
                  "
                  :warning="true"
                  tooltip="Update the Avatar ID and Name"
                  @click="handleAvatarUpdate(idx)"
                />
                <Button
                  label="Export"
                  :small="true"
                  :error="
                    failedAvatarUpdates.some((fu) => fu.id === a.avatarId && fu.action === 'export')
                  "
                  tooltip="Export avatar and all associated data to file"
                  @click="handleAvatarExport(idx)"
                />
                <Button
                  label="Delete"
                  :small="true"
                  :error="true"
                  tooltip="Delete avatar and all associated data"
                  @click="handleAvatarDelete(idx)"
                />
              </div>
            </div>
            {{ a.avatarId }}
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
                        :id="`configName-${cIdx}`"
                        :model-value="config.name"
                        @update:model-value="updateConfigField(cIdx, 'name', $event.value)"
                      />
                    </div>

                    <div class="data-table__config-field">
                      <InputCheckbox
                        :id="`configNsfw-${cIdx}`"
                        :model-value="config.nsfw ? true : false"
                        label="NSFW: "
                        @update:model-value="updateConfigField(cIdx, 'nsfw', $event.checked)"
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
                      :error="
                        failedConfigUpdates.some(
                          (fu) => fu.id === config.id && fu.action === 'apply'
                        )
                      "
                      @click="handleConfigApply(config.id)"
                    />
                    <Button
                      v-if="config.id"
                      label="Export"
                      :small="true"
                      tooltip="Export config and associated preset(optional) to file"
                      :error="
                        failedConfigUpdates.some(
                          (fu) => fu.id === config.id && fu.action === 'export'
                        )
                      "
                      @click="handleConfigExport(config.id)"
                    />
                    <Button
                      v-if="config.id"
                      label="Update"
                      :small="true"
                      tooltip="Update config name & NSFW status"
                      :error="
                        failedConfigUpdates.some(
                          (fu) => fu.id === config.id && fu.action === 'update'
                        )
                      "
                      :warning="true"
                      @click="handleConfigUpdate(cIdx)"
                    />
                    <Button
                      v-if="!config.isPreset"
                      label="Create Preset"
                      :small="true"
                      :hero="true"
                      tooltip="Create a new preset for this config"
                      :error="
                        failedConfigUpdates.some(
                          (fu) => fu.id === config.id && fu.action === 'createPreset'
                        )
                      "
                      @click="handleCreatePreset(cIdx)"
                    />
                    <Button
                      v-if="config.id"
                      label="Replace Params"
                      :small="true"
                      tooltip="Replace config parameters with ones from a file, must be a config file not an avatar file"
                      :error="
                        failedConfigUpdates.some(
                          (fu) => fu.id === config.id && fu.action === 'replace'
                        )
                      "
                      :warning="true"
                      @click="handleConfigReplace(cIdx)"
                    />
                    <Button
                      v-if="config.id"
                      label="Delete"
                      :small="true"
                      :error="true"
                      tooltip="Delete config and all associated presets"
                      @click="handleConfigDelete(cIdx)"
                    />
                  </div>

                  <div v-if="hasPresets && isConfigExpanded(cIdx)" class="data-table__presets">
                    <Card
                      v-for="(preset, pIdx) in allPresets"
                      :key="pIdx"
                      v-show="preset.forUqid === config.uqid"
                    >
                      <div class="data-table__preset">
                        <h4 class="data-table__preset-title">Preset</h4>

                        <div class="data-table__preset-fields">
                          <div class="data-table__preset-field">
                            <label class="data-table__preset-label">Name: </label>
                            <InputText
                              :id="`presetName-${pIdx}`"
                              :model-value="preset.name"
                              @update:model-value="updatePresetField(pIdx, 'name', $event.value)"
                            />
                          </div>

                          <div class="data-table__preset-field">
                            <label class="data-table__preset-label">Parameter: </label>
                            <InputNumber
                              :id="`presetParameter-${pIdx}`"
                              :model-value="preset.unityParameter"
                              @update:model-value="
                                updatePresetField(pIdx, 'unityParameter', $event.value)
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
                            :error="
                              failedPresetUpdates.some(
                                (fu) => fu.id === preset.id && fu.action === 'apply'
                              )
                            "
                            @click="handlePresetApply(pIdx)"
                          />
                          <Button
                            label="Update"
                            :small="true"
                            tooltip="Update preset name & parameter"
                            :error="
                              failedPresetUpdates.some(
                                (fu) => fu.id === preset.id && fu.action === 'update'
                              )
                            "
                            :warning="true"
                            @click="handlePresetUpdate(pIdx)"
                          />
                          <Button
                            label="Delete"
                            :small="true"
                            tooltip="Delete preset"
                            :error="true"
                            @click="handlePresetDelete(pIdx)"
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
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16px;
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

    &--expanded {
      transform: rotate(0deg);
    }

    svg {
      pointer-events: none;
    }
  }
}
</style>
