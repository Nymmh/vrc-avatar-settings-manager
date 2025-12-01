<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import Button from './Button.vue'
import LoadAvatarFile from './LoadAvatarFile.vue'
import InputCheckbox from './InputCheckbox.vue'
import InputText from './InputText.vue'
import InputNumber from './InputNumber.vue'
import { appStorage } from '../composables/appStorage'

const appStore = appStorage()

watch(
  () => appStore.value.dataTableRefresh,
  (newVal) => {
    if (newVal) {
      getAvatars()
      appStore.value.dataTableRefresh = false
    }
  }
)

const failedAvatarUpdates = ref<
  {
    avatarId: string
    action: 'export' | 'delete' | 'update'
  }[]
>([])
const failedConfigUpdates = ref<
  {
    id: number
    action: 'apply' | 'update' | 'export' | 'replace' | 'delete' | 'createPreset' | 'presetData'
  }[]
>([])
const failedPresetUpdates = ref<
  {
    id: number
    action: 'apply' | 'update' | 'delete'
  }[]
>([])
const allAvatars = ref<Awaited<ReturnType<typeof window.avatarApi.getAllAvatars>>>([])
const allConfigs = ref<Awaited<ReturnType<typeof window.avatarApi.getConfigById>>>([])
const allPresets = ref<Awaited<ReturnType<typeof window.avatarApi.getAllPresets>>>([])
const expandedAvatarRow = ref<number | null>(null)
const expandedConfigRow = ref<number | null>(null)

const getAvatars = async (): Promise<void> => {
  expandedAvatarRow.value = null
  expandedConfigRow.value = null
  allConfigs.value = []
  allPresets.value = []
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
  allPresets.value = []
  const uqid = allConfigs.value![idx].uqid

  if (!uqid) {
    emit('notification', {
      type: 'error',
      title: 'Preset ID missing'
    })
    return
  }

  allPresets.value = await window.avatarApi.getPresetsByUqid(uqid)
}

const isAvatarExpanded = (index: number): boolean => {
  return expandedAvatarRow.value === index
}

const isConfigExpanded = (index: number): boolean => {
  return expandedConfigRow.value === index
}

const toggleAvatar = (index: number): void => {
  allConfigs.value = []
  if (expandedAvatarRow.value === index) {
    expandedAvatarRow.value = null
  } else {
    expandedAvatarRow.value = index
    getConfigsByAvatar(allAvatars.value[index].avatarId)
  }
}

const toggleConfig = (index: number): void => {
  allPresets.value = []
  if (expandedConfigRow.value === index) {
    expandedConfigRow.value = null
  } else {
    expandedConfigRow.value = index
    getPresetsByConfig(index)
  }
}

const handleUpdate = async (type: string, index: number): Promise<void> => {
  if (type === 'avatar') {
    failedAvatarUpdates.value = failedAvatarUpdates.value.filter(
      (id) => id.avatarId !== allAvatars.value[index].avatarId
    )

    if (!allAvatars.value![index].name || allAvatars.value![index].name.trim() === '') {
      failedAvatarUpdates.value.push({
        avatarId: allAvatars.value![index].avatarId,
        action: 'update'
      })

      emit('notification', {
        type: 'error',
        title: 'Update Failed',
        text: 'Avatar name cannot be empty.'
      })
      return
    }

    const res = await window.avatarApi.updateAvatarData(
      allAvatars.value![index].avatarId,
      allAvatars.value![index].name
    )

    let type = 'success'
    let title = 'Update Successful'

    if (!res.success) {
      type = 'error'
      title = 'Update Failed'
      failedAvatarUpdates.value.push({
        avatarId: allAvatars.value![index].avatarId,
        action: 'update'
      })
    }

    emit('notification', {
      type: type,
      title: title,
      text: res.message
    })
  }
}

const handleExport = async (type: string, index: number): Promise<void> => {
  if (type === 'avatar') {
    const res = await window.avatarApi.exportAvatar(allAvatars.value[index].avatarId)

    let type = 'success'
    let title = 'Export Successful'
    failedAvatarUpdates.value = failedAvatarUpdates.value.filter(
      (id) => id.avatarId !== allAvatars.value[index].avatarId
    )

    if (!res.success) {
      type = 'error'
      title = 'Export Failed'
      failedAvatarUpdates.value.push({
        avatarId: allAvatars.value[index].avatarId,
        action: 'export'
      })
    }

    emit('notification', {
      type: type,
      title: title,
      text: res.message
    })
  }
}

const handleDelete = async (type: string, index: number): Promise<void> => {
  if (type === 'avatar') {
    const res = await window.avatarApi.deleteAvatar(allAvatars.value[index].avatarId)

    let type = 'success'
    let title = 'Delete Successful'
    failedAvatarUpdates.value = failedAvatarUpdates.value.filter(
      (id) => id.avatarId !== allAvatars.value[index].avatarId
    )

    if (!res.success) {
      type = 'error'
      title = 'Delete Failed'
      failedAvatarUpdates.value.push({
        avatarId: allAvatars.value[index].avatarId,
        action: 'delete'
      })
    } else {
      allAvatars.value.splice(index, 1)
    }

    emit('notification', {
      type: type,
      title: title,
      text: res.message
    })
  }
}

const handleConfigApply = async (configId: number): Promise<void> => {
  failedConfigUpdates.value = failedConfigUpdates.value.filter((id) => id.id !== configId)

  const res = await window.avatarApi.applyConfig(configId)

  let type = 'success'
  let title = 'Apply Successful'

  if (!res.success) {
    type = 'error'
    title = 'Apply Failed'
    failedConfigUpdates.value.push({
      id: configId,
      action: 'apply'
    })
  }

  emit('notification', {
    type: type,
    title: title
  })
}
const handleConfigExport = async (configId: number): Promise<void> => {
  failedConfigUpdates.value = failedConfigUpdates.value.filter((id) => id.id !== configId)

  const res = await window.avatarApi.exportConfig(configId)

  let type = 'success'
  let title = 'Export Successful'

  if (!res.success) {
    type = 'error'
    title = 'Export Failed'
    failedConfigUpdates.value.push({
      id: configId,
      action: 'export'
    })
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handleConfigUpdate = async (index: number, configId: number): Promise<void> => {
  if (!allConfigs.value![index].id) {
    failedConfigUpdates.value.push({
      id: configId,
      action: 'update'
    })

    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'ID not valid.'
    })
    return
  }

  failedConfigUpdates.value = failedConfigUpdates.value.filter((id) => id.id !== configId)

  const res = await window.avatarApi.updateConfigData(
    allConfigs.value![index].id,
    allConfigs.value![index].avatarId || 'Unknown',
    allConfigs.value![index].name,
    allConfigs.value![index].nsfw ? true : false
  )

  let type = 'success'
  let title = 'Update Successful'

  if (!res.success) {
    type = 'error'
    title = 'Update Failed'
    failedConfigUpdates.value.push({
      id: configId,
      action: 'update'
    })
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handleCreatePreset = async (index: number): Promise<void> => {
  const config = allConfigs.value![index]

  if (!config.id) {
    failedConfigUpdates.value.push({
      id: index,
      action: 'update'
    })

    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'ID not valid.'
    })
    return
  }

  failedConfigUpdates.value = failedConfigUpdates.value.filter((id) => id.id !== config.id)

  const res = await window.avatarApi.createPresetFromApp(config.id)

  let type = 'success'
  let title = 'Create Preset Successful'

  if (!res.success) {
    type = 'error'
    title = 'Create Preset Failed'
    failedConfigUpdates.value.push({
      id: config.id,
      action: 'createPreset'
    })
  }

  if (res.success && config.avatarId) {
    getConfigsByAvatar(config.avatarId)
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handleConfigReplace = async (index: number, configId: number): Promise<void> => {
  failedConfigUpdates.value = failedConfigUpdates.value.filter((id) => id.id !== configId)

  const res = await window.avatarApi.replaceParams(configId)

  let type = 'success'
  let title = 'Replace Params Successful'

  if (!res.success) {
    type = 'error'
    title = 'Replace Params Failed'
    failedConfigUpdates.value.push({
      id: configId,
      action: 'replace'
    })
  } else {
    const avatarId = allConfigs.value![index].avatarId
    if (avatarId) {
      getConfigsByAvatar(avatarId)
    }
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handleConfigDelete = async (index: number, configId: number): Promise<void> => {
  failedConfigUpdates.value = failedConfigUpdates.value.filter((id) => id.id !== configId)

  const res = await window.avatarApi.deleteConfig(configId)

  let type = 'success'
  let title = 'Delete Successful'

  if (!res.success) {
    type = 'error'
    title = 'Delete Failed'
    failedConfigUpdates.value.push({
      id: configId,
      action: 'delete'
    })
  } else {
    allConfigs.value!.splice(index, 1)
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handlePresetApply = async (idx: number): Promise<void> => {
  const res = await window.avatarApi.applyPresetFromApp(
    allPresets.value![idx].avatarId,
    allPresets.value![idx].unityParameter
  )

  let type = 'success'
  let title = 'Apply Successful'
  failedPresetUpdates.value = failedPresetUpdates.value.filter(
    (id) => id.id !== allPresets.value![idx].id
  )

  if (!res) {
    type = 'error'
    title = 'Apply Failed'
    failedPresetUpdates.value.push({ id: allPresets.value![idx].id, action: 'apply' })
  }

  emit('notification', {
    type,
    title
  })
}

const handlePresetUpdate = async (idx: number): Promise<void> => {
  failedPresetUpdates.value = failedPresetUpdates.value.filter(
    (id) => id.id !== allPresets.value![idx].id
  )

  if (!allPresets.value![idx].name || allPresets.value![idx].name.trim() === '') {
    failedPresetUpdates.value.push({ id: allPresets.value![idx].id, action: 'update' })

    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'Preset name cannot be empty.'
    })
    return
  }

  if (!allPresets.value![idx].unityParameter || isNaN(allPresets.value![idx].unityParameter)) {
    failedPresetUpdates.value.push({ id: allPresets.value![idx].id, action: 'update' })

    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'Unity parameter must be a valid number.'
    })
    return
  }

  if (allPresets.value![idx].unityParameter <= 0) {
    failedPresetUpdates.value.push({ id: allPresets.value![idx].id, action: 'update' })

    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'Unity parameter must be greater than zero.'
    })
    return
  }

  const res = await window.avatarApi.updatePresetFromApp(
    allPresets.value![idx].id,
    allPresets.value![idx].name,
    allPresets.value![idx].unityParameter
  )

  let type = 'success'
  let title = 'Update Successful'

  if (!res.success) {
    type = 'error'
    title = 'Update Failed'
    failedPresetUpdates.value.push({ id: allPresets.value![idx].id, action: 'update' })
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handlePresetDelete = async (idx: number): Promise<void> => {
  let res = await window.avatarApi.deletePresetFromApp(allPresets.value![idx].id)

  let type = 'success'
  let title = 'Delete Successful'
  failedPresetUpdates.value = failedPresetUpdates.value.filter(
    (id) => id.id !== allPresets.value![idx].id
  )

  if (!res.success) {
    type = 'error'
    title = 'Delete Failed'
    failedPresetUpdates.value.push({ id: allPresets.value![idx].id, action: 'delete' })
  } else {
    getConfigsByAvatar(allPresets.value![idx].avatarId)
  }

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleInputUpdate = (type: string, idx: number, field: string, value: string): void => {
  if (type === 'avatar') {
    if (!allAvatars.value || allAvatars.value.length === 0) return

    const save = allAvatars.value[idx]

    if (!save) return
    ;(save[field] as string) = value
  } else if (type === 'config') {
    if (!allConfigs.value || allConfigs.value.length === 0) return

    const config = allConfigs.value[idx]

    if (!config) return
    ;(config[field] as string | boolean) = value
  } else if (type === 'preset') {
    if (!allPresets.value || allPresets.value.length === 0) return

    const preset = allPresets.value[idx]

    if (!preset) return
    ;(preset[field] as string) = value
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
                    @update:model-value="handleInputUpdate('avatar', idx, 'name', $event.value)"
                  />
                </td>
                <td class="data-table__cell data-table__cell-actions">
                  <Button
                    label="Update"
                    :small="true"
                    :error="
                      failedAvatarUpdates.some(
                        (fu) => fu.avatarId === a.avatarId && fu.action === 'update'
                      )
                    "
                    @click="handleUpdate('avatar', idx)"
                  />
                  <Button
                    label="Export"
                    :small="true"
                    :error="
                      failedAvatarUpdates.some(
                        (fu) => fu.avatarId === a.avatarId && fu.action === 'export'
                      )
                    "
                    @click="handleExport('avatar', idx)"
                  />
                  <Button
                    label="Delete"
                    :small="true"
                    :error="
                      failedAvatarUpdates.some(
                        (fu) => fu.avatarId === a.avatarId && fu.action === 'delete'
                      )
                    "
                    @click="handleDelete('avatar', idx)"
                  />
                </td>
              </tr>
              <tr
                v-if="isAvatarExpanded(idx)"
                class="data-table__table-row data-table__table-row--expanded underline"
              >
                <td colspan="4" class="data-table__cell data-table__cell--details">
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
                  <div v-if="allConfigs && allConfigs.length" class="data-table__details">
                    <div
                      v-for="(config, idx) in allConfigs"
                      :key="idx"
                      :class="{
                        underline: allConfigs.length != idx + 1
                      }"
                    >
                      <div class="data-table__details-grid">
                        <div class="data-table__detail-item data-table__detail-item-expand">
                          <div v-if="config.isPreset" class="data-table__expand-button-wrapper">
                            <button
                              :class="[
                                'data-table__expand-button',
                                { 'data-table__expand-button--expanded': isConfigExpanded(idx) }
                              ]"
                              @click="toggleConfig(idx)"
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
                              :id="`configName-${idx}`"
                              :model-value="config.name"
                              @update:model-value="
                                handleInputUpdate('config', idx, 'name', $event.value)
                              "
                            />
                          </span>
                        </div>
                        <div class="data-table__detail-item">
                          <InputCheckbox
                            :id="`configNsfw-${idx}`"
                            :model-value="config.nsfw ? true : false"
                            label=" "
                            @update:model-value="
                              handleInputUpdate('config', idx, 'nsfw', $event.checked)
                            "
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
                            @click="handleConfigUpdate(idx, config.id)"
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
                            @click="handleCreatePreset(idx)"
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
                            @click="handleConfigReplace(idx, config.id)"
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
                            @click="handleConfigDelete(idx, config.id)"
                          />
                        </div>
                      </div>
                      <div v-if="allPresets && allPresets.length && isConfigExpanded(idx)">
                        <div v-for="(preset, idx) in allPresets" :key="idx">
                          <div v-if="preset.forUqid === config.uqid" class="data-table__preset">
                            <div class="data-table__preset-grid">
                              <div class="data-table__preset-item">
                                <span class="data-table__preset-label">Preset Name</span>
                                <InputText
                                  :id="`presetName-${idx}`"
                                  :model-value="preset.name"
                                  @update:model-value="
                                    handleInputUpdate('preset', idx, 'name', $event.value)
                                  "
                                />
                              </div>
                              <div class="data-table__preset-item">
                                <span class="data-table__preset-label">Preset Parameter</span>
                                <InputNumber
                                  :id="`presetParameter-${idx}`"
                                  :model-value="preset.unityParameter"
                                  @update:model-value="
                                    handleInputUpdate('preset', idx, 'unityParameter', $event.value)
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
                                  @click="handlePresetApply(idx)"
                                />
                                <Button
                                  label="Update"
                                  :small="true"
                                  :error="
                                    failedPresetUpdates.some(
                                      (fu) => fu.id === preset.id && fu.action === 'update'
                                    )
                                  "
                                  @click="handlePresetUpdate(idx)"
                                />
                                <Button
                                  label="Delete"
                                  :small="true"
                                  :error="
                                    failedPresetUpdates.some(
                                      (fu) => fu.id === preset.id && fu.action === 'delete'
                                    )
                                  "
                                  @click="handlePresetDelete(idx)"
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
