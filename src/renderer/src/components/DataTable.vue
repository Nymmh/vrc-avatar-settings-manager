<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import Button from './Button.vue'
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
const allPresets = ref<Awaited<ReturnType<typeof window.avatarApi.getAllPresets>>>([])
const expandedAvatarRow = ref<number | null>(null)
const expandedConfigRow = ref<number | null>(null)

const hasConfigs = computed(() => allConfigs.value && allConfigs.value.length > 0)
const hasPresets = computed(() => allPresets.value?.length > 0)

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

const isAvatarExpanded = (idx: number): boolean => expandedAvatarRow.value === idx
const isConfigExpanded = (idx: number): boolean => expandedConfigRow.value === idx
const toggleAvatar = (idx: number): void => {
  if (expandedAvatarRow.value === idx) {
    expandedAvatarRow.value = null
    allConfigs.value = []
  } else {
    expandedAvatarRow.value = idx
    getConfigsByAvatar(allAvatars.value[idx].avatarId)
  }
}

const toggleConfig = (idx: number): void => {
  if (expandedConfigRow.value === idx) {
    expandedConfigRow.value = null
    allPresets.value = []
  } else {
    expandedConfigRow.value = idx
    getPresetsByConfig(idx)
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
  const avatar = allAvatars.value[idx]
  const avatarId = avatar.avatarId

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

  const res = await window.avatarApi.updateAvatarData(avatarId, avatar.name)
  handleOperation(
    res,
    'Update Successful',
    'Update Failed',
    avatarId,
    'update',
    failedAvatarUpdates.value
  )
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

const refreshListen = async (): Promise<void> => {
  await window.avatarApi.dataTableRefresh(() => {
    getAvatars()
  })
}

onMounted(() => {
  getAvatars()
  refreshListen()
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
    <div class="data-table__content">
      <LoadAvatarFile @uploaded="getAvatars" @notification="$emit('notification', $event)" />
      <div class="data-table__table-wrapper">
        <table class="data-table__table">
          <thead class="data-table__table-head">
            <tr class="data-table__table-row">
              <th class="data-table__table-header">Avatar Id</th>
              <th class="data-table__table-header">Avatar Name</th>
              <th class="data-table__table-header"></th>
            </tr>
          </thead>
          <tbody class="data-table__table-body">
            <template v-for="(a, idx) in allAvatars" :key="idx">
              <tr :class="['data-table__table-row', { underline: allAvatars.length != idx + 1 }]">
                <td class="data-table__cell data-table__cell--expand">
                  <div class="data-table__expand-button-wrapper">
                    <button
                      :class="[
                        'data-table__expand-button',
                        { 'data-table__expand-button--expanded': isAvatarExpanded(idx) }
                      ]"
                      @click="toggleAvatar(idx)"
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
                  </div>
                  {{ a.avatarId }}
                </td>
                <td class="data-table__cell">
                  <InputText
                    :id="`avatarName-${idx}`"
                    :model-value="a.name"
                    @update:model-value="updateAvatarField(idx, 'name', $event.value)"
                  />
                </td>
                <td class="data-table__cell data-table__cell-actions">
                  <Button
                    label="Update"
                    :small="true"
                    :error="
                      failedAvatarUpdates.some(
                        (fu) => fu.id === a.avatarId && fu.action === 'update'
                      )
                    "
                    @click="handleAvatarUpdate(idx)"
                  />
                  <Button
                    label="Export"
                    :small="true"
                    :error="
                      failedAvatarUpdates.some(
                        (fu) => fu.id === a.avatarId && fu.action === 'export'
                      )
                    "
                    @click="handleAvatarExport(idx)"
                  />
                  <Button
                    label="Delete"
                    :small="true"
                    :error="
                      failedAvatarUpdates.some(
                        (fu) => fu.id === a.avatarId && fu.action === 'delete'
                      )
                    "
                    @click="handleAvatarDelete(idx)"
                  />
                </td>
              </tr>
              <tr
                v-if="isAvatarExpanded(idx)"
                class="data-table__table-row data-table__table-row--expanded underline"
              >
                <td colspan="3" class="data-table__cell data-table__cell--details">
                  <div class="data-table__details">
                    <div class="data-table__details-grid">
                      <div class="data-table__detail-item">
                        <span class="data-table__detail-label">Config Name</span>
                      </div>
                      <div class="data-table__detail-item">
                        <span class="data-table__detail-label">NSFW</span>
                      </div>
                      <div class="data-table__detail-item">
                        <span class="data-table__detail-label">From File</span>
                      </div>
                      <div class="data-table__detail-item">
                        <span class="data-table__detail-label"></span>
                      </div>
                    </div>
                  </div>
                  <div v-if="hasConfigs" class="data-table__details">
                    <div
                      v-for="(config, cIdx) in allConfigs"
                      :key="cIdx"
                      :class="{
                        underline: allConfigs?.length != cIdx + 1
                      }"
                    >
                      <div class="data-table__details-grid">
                        <div class="data-table__detail-item data-table__detail-item-expand">
                          <div v-if="config.isPreset" class="data-table__expand-button-wrapper">
                            <button
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
                                <path
                                  d="M4 6l4 4 4-4"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  fill="none"
                                />
                              </svg>
                            </button>
                          </div>
                          <span class="data-table__detail-label">
                            <InputText
                              :id="`configName-${cIdx}`"
                              :model-value="config.name"
                              @update:model-value="updateConfigField(cIdx, 'name', $event.value)"
                            />
                          </span>
                        </div>
                        <div class="data-table__detail-item">
                          <InputCheckbox
                            :id="`configNsfw-${cIdx}`"
                            :model-value="config.nsfw ? true : false"
                            label=" "
                            @update:model-value="updateConfigField(cIdx, 'nsfw', $event.checked)"
                          />
                        </div>
                        <div class="data-table__detail-item">
                          <span class="data-table__detail-label">
                            {{ config.fromFile ? 'Yes' : 'No' }}
                          </span>
                        </div>
                        <div class="data-table__detail-item data-table__cell-actions">
                          <Button
                            v-if="config.id"
                            label="Apply"
                            :small="true"
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
                            :error="
                              failedConfigUpdates.some(
                                (fu) => fu.id === config.id && fu.action === 'update'
                              )
                            "
                            @click="handleConfigUpdate(cIdx)"
                          />
                          <Button
                            v-if="!config.isPreset"
                            label="Create Preset"
                            :small="true"
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
                            :error="
                              failedConfigUpdates.some(
                                (fu) => fu.id === config.id && fu.action === 'replace'
                              )
                            "
                            @click="handleConfigReplace(cIdx)"
                          />
                          <Button
                            v-if="config.id"
                            label="Delete"
                            :small="true"
                            :error="
                              failedConfigUpdates.some(
                                (fu) => fu.id === config.id && fu.action === 'delete'
                              )
                            "
                            @click="handleConfigDelete(cIdx)"
                          />
                        </div>
                      </div>
                      <div v-if="hasPresets && isConfigExpanded(cIdx)">
                        <div v-for="(preset, pIdx) in allPresets" :key="pIdx">
                          <div v-if="preset.forUqid === config.uqid" class="data-table__preset">
                            <div class="data-table__preset-grid">
                              <div class="data-table__preset-item">
                                <span class="data-table__preset-label">Preset Name</span>
                                <InputText
                                  :id="`presetName-${pIdx}`"
                                  :model-value="preset.name"
                                  @update:model-value="
                                    updatePresetField(pIdx, 'name', $event.value)
                                  "
                                />
                              </div>
                              <div class="data-table__preset-item">
                                <span class="data-table__preset-label">Preset Parameter</span>
                                <InputNumber
                                  :id="`presetParameter-${pIdx}`"
                                  :model-value="preset.unityParameter"
                                  @update:model-value="
                                    updatePresetField(pIdx, 'unityParameter', $event.value)
                                  "
                                />
                              </div>
                              <div class="data-table__preset-actions">
                                <Button
                                  label="Apply"
                                  :small="true"
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
                                  :error="
                                    failedPresetUpdates.some(
                                      (fu) => fu.id === preset.id && fu.action === 'update'
                                    )
                                  "
                                  @click="handlePresetUpdate(pIdx)"
                                />
                                <Button
                                  label="Delete"
                                  :small="true"
                                  :error="
                                    failedPresetUpdates.some(
                                      (fu) => fu.id === preset.id && fu.action === 'delete'
                                    )
                                  "
                                  @click="handlePresetDelete(pIdx)"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.data-table {
  display: flex;
  flex-flow: column;
  gap: 28px;
  height: 100%;
  position: relative;
  overflow: hidden;
  width: 100%;

  &__content {
    display: flex;
    flex-flow: column;
    gap: 28px;
    height: 100%;
    overflow-x: auto;
    overflow-y: auto;
    padding-right: 8px;
    justify-content: center;
    width: 100%;
  }

  &__table-wrapper {
    overflow-x: hidden;
    width: 100%;
  }

  &__table {
    border-collapse: collapse;
    width: 100%;
  }

  &__table-header {
    background: var(--color--primary-a1);
    padding-top: 16px;
    position: sticky;
    top: 0;
    vertical-align: middle;
    z-index: 1;

    &:not(:first-child) {
      padding-left: 16px;
    }

    &:not(:last-child) {
      padding-right: 16px;
    }
  }

  &__cell {
    padding-top: 16px;
    padding-bottom: 16px;
    vertical-align: middle;

    &:not(:first-child) {
      padding-left: 16px;
    }

    &:not(:last-child) {
      padding-right: 16px;
    }

    &--expand {
      align-items: center;
      display: flex;
      gap: 8px;
    }

    &--details {
      padding-left: 2rem;
    }
  }

  &__expand-button-wrapper {
    height: 30px;
    width: 30px;
  }

  &__expand-button {
    align-items: center;
    display: flex;
    cursor: pointer;
    height: 100%;
    justify-content: center;
    transform: rotate(-90deg);
    transition: transform 0.2s;
    width: 100%;

    &--expanded {
      transform: rotate(0deg);
    }

    svg {
      pointer-events: none;
    }
  }

  &__cell-actions {
    align-items: center;
    display: flex;
    flex-flow: row wrap;
    gap: 8px;
  }

  &__detail-item-expand {
    align-items: center;
    display: flex;
    flex-flow: row nowrap;
    gap: 12px;
  }

  &__details {
    width: 100%;
  }

  &__details-grid {
    align-items: center;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    padding-top: 16px;
    width: 100%;
  }

  &__preset {
    padding-left: 4rem;
    padding-top: 16px;
  }

  &__preset-grid {
    align-items: center;
    border-top: 1px solid var(--color--primary-a3);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    padding-top: 16px;
    width: 100%;
  }

  &__preset-item {
    display: flex;
    flex-flow: column;
    gap: 12px;
  }

  &__preset-actions {
    align-items: center;
    display: flex;
    flex-flow: row wrap;
    gap: 8px;
  }

  &__empty {
    text-align: center;
  }
}
</style>
