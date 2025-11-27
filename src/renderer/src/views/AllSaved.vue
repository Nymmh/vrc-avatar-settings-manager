<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Button from '@renderer/components/Button.vue'
import LoadFile from '@renderer/components/LoadFile.vue'
import InputText from '@renderer/components/InputText.vue'
import InputCheckbox from '@renderer/components/InputCheckbox.vue'
import AllPresets from './AllPresets.vue'
import Modal from '@renderer/components/Modal.vue'

const props = defineProps({
  isModal: {
    type: Boolean,
    default: false
  },
  avatarUqid: {
    type: String,
    default: ''
  }
})

const failedUpdates = ref<
  {
    id: number
    action: 'apply' | 'update' | 'export' | 'replace' | 'delete' | 'createPreset' | 'presetData'
  }[]
>([])
const allSaves = ref<Awaited<ReturnType<typeof window.avatarApi.getAllSaved>>>([])
const showModal = ref(false)
const showModalSearchId = ref<string>('')

const getSaves = async (): Promise<void> => {
  allSaves.value = await window.avatarApi.getAllSaved()
}

const getSavedByUqid = async (uqid: string): Promise<void> => {
  allSaves.value = await window.avatarApi.getSavedByUqid(uqid)
}

const handleApply = async (idx: number, id: number): Promise<void> => {
  const res = await window.avatarApi.applyConfig(id)

  let type = 'success'
  let title = 'Apply Successful'
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allSaves.value![idx].id)

  if (!res.success) {
    type = 'error'
    title = 'Apply Failed'
    failedUpdates.value.push({ id: allSaves.value![idx].id, action: 'apply' })
  }

  emit('notification', {
    type,
    title
  })
}

const handleExport = async (idx: number, id: number): Promise<void> => {
  const res = await window.avatarApi.exportConfig(id)

  let type = 'success'
  let title = 'Export Successful'
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allSaves.value![idx].id)

  if (!res.success) {
    type = 'error'
    title = 'Export Failed'
    failedUpdates.value.push({ id: allSaves.value![idx].id, action: 'export' })
  }

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleUpdate = async (idx: number): Promise<void> => {
  console.log(allSaves.value![idx].name)
  console.log('here')
  const res = await window.avatarApi.updateConfigData(
    allSaves.value![idx].id,
    allSaves.value![idx].avatarId || 'Unknown',
    allSaves.value![idx].name,
    allSaves.value![idx].nsfw ? true : false
  )

  let type = 'success'
  let title = 'Update Successful'
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allSaves.value![idx].id)

  if (!res.success) {
    type = 'error'
    title = 'Update Failed'
    failedUpdates.value.push({ id: allSaves.value![idx].id, action: 'update' })
  } else {
    getSaves()
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handleReplace = async (idx: number, id: number): Promise<void> => {
  const res = await window.avatarApi.replaceParams(id)

  let type = 'success'
  let title = 'Replace Parameters Successful'
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allSaves.value![idx].id)

  if (!res.success) {
    type = 'error'
    title = 'Replace Parameters Failed'
    failedUpdates.value.push({ id: allSaves.value![idx].id, action: 'replace' })
  }

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleDelete = async (idx: number, id: number): Promise<void> => {
  let res = await window.avatarApi.deleteConfig(id)

  let type = 'success'
  let title = 'Delete Successful'
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allSaves.value![idx].id)

  if (!res.success) {
    type = 'error'
    title = 'Delete Failed'
    failedUpdates.value.push({ id: allSaves.value![idx].id, action: 'delete' })
  } else {
    await getSaves()
    emit('force-update')
  }

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleCreatePreset = async (idx: number): Promise<void> => {
  let res = await window.avatarApi.createPresetFromApp(allSaves.value![idx].id)

  let type = 'success'
  let title = 'Create Preset Successful'
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allSaves.value![idx].id)

  if (!res.success) {
    type = 'error'
    title = 'Create Preset Failed'
    failedUpdates.value.push({ id: allSaves.value![idx].id, action: 'createPreset' })
  } else {
    await getSaves()
  }

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleShowModal = (idx: number): void => {
  showModal.value = true
  showModalSearchId.value = allSaves.value![idx].uqid
}

const handleInputUpdate = (
  idx: number,
  field: 'avatarId' | 'name' | 'nsfw',
  value: string | boolean
): void => {
  if (!allSaves.value || allSaves.value.length === 0) return

  const save = allSaves.value[idx]

  if (!save) return
  ;(save[field] as string | boolean) = value
}

onMounted(() => {
  if (!props.isModal) {
    getSaves()
  } else {
    getSavedByUqid(props.avatarUqid)
  }
})

onUnmounted(() => {
  console.log('unfired')
})

const emit = defineEmits(['loadFromFile', 'notification', 'force-update'])
</script>

<template>
  <div class="all-saved">
    <Modal v-if="showModal" class="all-saved__modal" @close-modal="showModal = false">
      <template #default>
        <AllPresets
          :is-modal="true"
          :avatar-uqid="showModalSearchId"
          @notification="emit('notification', $event)"
          @force-update="((showModal = false), getSaves())"
        />
      </template>
    </Modal>
    <div v-if="!showModal" class="all-saved__content">
      <LoadFile
        v-if="!isModal && !showModal"
        :show-save="false"
        :show-id-mismatch="false"
        :direct-upload="true"
        :show-nsfw-option="true"
        @uploaded="getSaves"
        @notification="$emit('notification', $event)"
      />
      <div class="all-saved__table-wrapper">
        <table v-if="allSaves && allSaves.length" class="all-saved__table">
          <thead class="all-saved__table-head">
            <tr class="all-saved__table-row">
              <th class="all-saved__table-header underline">Avatar ID</th>
              <th class="all-saved__table-header underline">Avatar Name</th>
              <th class="all-saved__table-header underline">Save Name</th>
              <th class="all-saved__table-header underline">NSFW</th>
              <th class="all-saved__table-header underline">From File</th>
              <th class="all-saved__table-header underline"></th>
            </tr>
          </thead>
          <tbody class="all-saved__table-body">
            <tr v-for="(a, idx) in allSaves" :key="idx" class="all-saved__table-row underline">
              <td class="all-saved__cell">
                <InputText
                  :id="`avatarId-${idx}`"
                  :model-value="a.avatarId"
                  @update:model-value="handleInputUpdate(idx, 'avatarId', $event.value)"
                />
              </td>
              <td class="all-saved__cell">
                <p>{{ a.avatarName }}</p>
              </td>
              <td class="all-saved__cell">
                <InputText
                  :id="`saveName-${idx}`"
                  :model-value="a.name"
                  @update:model-value="handleInputUpdate(idx, 'name', $event.value)"
                />
              </td>
              <td class="all-saved__cell">
                <InputCheckbox
                  :id="`nsfw-${idx}`"
                  :model-value="a.nsfw ? true : false"
                  label=" "
                  @update:model-value="handleInputUpdate(idx, 'nsfw', $event.checked)"
                />
              </td>
              <td class="all-saved__cell">
                <p>{{ a.fromFile ? 'True' : 'False' }}</p>
              </td>
              <td class="all-saved__cell all-saved__cell-actions">
                <Button
                  label="Apply"
                  :small="true"
                  :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'apply')"
                  @click="handleApply(idx, a.id)"
                />
                <Button
                  label="Export"
                  :small="true"
                  :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'export')"
                  @click="handleExport(idx, a.id)"
                />
                <Button
                  label="Update"
                  :small="true"
                  :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'update')"
                  @click="handleUpdate(idx)"
                />
                <Button
                  v-if="!a.isPreset"
                  label="Create Preset"
                  :small="true"
                  :error="
                    failedUpdates.some((fu) => fu.id === a.id && fu.action === 'createPreset')
                  "
                  @click="handleCreatePreset(idx)"
                />
                <Button
                  v-if="a.isPreset && !props.isModal"
                  label="Preset"
                  :small="true"
                  :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'presetData')"
                  @click="handleShowModal(idx)"
                />
                <Button
                  label="Replace Params"
                  :small="true"
                  :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'replace')"
                  @click="handleReplace(idx, a.id)"
                />
                <Button
                  label="Delete"
                  :small="true"
                  :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'delete')"
                  @click="handleDelete(idx, a.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="all-saved__empty">No saved configs.</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.all-saved {
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
    justify-content: center;
    overflow-x: auto;
    overflow-y: auto;
    padding-right: 8px;
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
      border-right: 1px solid var(--color--primary-a3);
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
      border-right: 1px solid var(--color--primary-a3);
      padding-right: 16px;
    }
  }

  &__cell-actions {
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
