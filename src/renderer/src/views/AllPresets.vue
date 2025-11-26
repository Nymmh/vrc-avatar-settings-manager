<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Button from '@renderer/components/Button.vue'
import InputNumber from '@renderer/components/InputNumber.vue'
import InputText from '@renderer/components/InputText.vue'
import Modal from '@renderer/components/Modal.vue'
import AllSaved from '@renderer/views/AllSaved.vue'

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
    action: 'apply' | 'update' | 'delete' | 'avatar'
  }[]
>([])
const allPresets = ref<Awaited<ReturnType<typeof window.avatarApi.getAllPresets>>>([])
const showModal = ref(false)
const showModalSearchId = ref<string>('')

const getPresets = async (): Promise<void> => {
  allPresets.value = await window.avatarApi.getAllPresets()
}

const getPresetsByUqid = async (uqid: string): Promise<void> => {
  allPresets.value = await window.avatarApi.getPresetsByUqid(uqid)
}

const handleApply = async (idx: number): Promise<void> => {
  const res = await window.avatarApi.applyPresetFromApp(
    allPresets.value![idx].avatarId,
    allPresets.value![idx].unityParameter
  )

  let type = 'success'
  let title = 'Apply Successful'
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allPresets.value![idx].id)

  if (!res) {
    type = 'error'
    title = 'Apply Failed'
    failedUpdates.value.push({ id: allPresets.value![idx].id, action: 'apply' })
  }

  emit('notification', {
    type,
    title
  })
}

const handleUpdate = async (idx: number): Promise<void> => {
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allPresets.value![idx].id)

  if (!allPresets.value![idx].name || allPresets.value![idx].name.trim() === '') {
    failedUpdates.value.push({ id: allPresets.value![idx].id, action: 'update' })

    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'Preset name cannot be empty.'
    })
    return
  }

  if (!allPresets.value![idx].unityParameter || isNaN(allPresets.value![idx].unityParameter)) {
    failedUpdates.value.push({ id: allPresets.value![idx].id, action: 'update' })

    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'Unity parameter must be a valid number.'
    })
    return
  }

  if (allPresets.value![idx].unityParameter <= 0) {
    failedUpdates.value.push({ id: allPresets.value![idx].id, action: 'update' })

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
    failedUpdates.value.push({ id: allPresets.value![idx].id, action: 'update' })
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handleInputUpdate = (
  idx: number,
  field: 'name' | 'unityParameter',
  value: string | number
): void => {
  if (!allPresets.value || allPresets.value.length === 0) return

  const save = allPresets.value[idx]

  if (!save) return
  ;(save[field] as string | number) = value
}

const handleDelete = async (idx: number): Promise<void> => {
  let res = await window.avatarApi.deletePresetFromApp(allPresets.value![idx].id)

  let type = 'success'
  let title = 'Delete Successful'
  failedUpdates.value = failedUpdates.value.filter((id) => id.id !== allPresets.value![idx].id)

  if (!res.success) {
    type = 'error'
    title = 'Delete Failed'
    failedUpdates.value.push({ id: allPresets.value![idx].id, action: 'delete' })
  } else {
    await getPresets()
    emit('force-update')
  }

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleShowModal = (idx: number): void => {
  showModal.value = true
  showModalSearchId.value = allPresets.value![idx].forUqid
}

onMounted(() => {
  if (!props.isModal) {
    getPresets()
  } else {
    getPresetsByUqid(props.avatarUqid)
  }
})

onUnmounted(() => {
  console.log('unfired')
})

const emit = defineEmits(['notification', 'force-update'])
</script>

<template>
  <div class="all-presets">
    <Modal v-if="showModal" class="all-presets__modal" @close-modal="showModal = false">
      <template #default>
        <AllSaved
          :is-modal="true"
          :avatar-uqid="showModalSearchId"
          @notification="emit('notification', $event)"
          @force-update="((showModal = false), getPresets())"
        />
      </template>
    </Modal>
    <div v-if="!showModal" class="all-presets__table-wrapper">
      <table v-if="allPresets && allPresets.length" class="all-presets__table">
        <thead class="all-presets__table-head">
          <tr class="all-presets__table-row">
            <th class="all-presets__table-header underline">Name</th>
            <th class="all-presets__table-header underline">Parameter</th>
            <th class="all-presets__table-header underline"></th>
          </tr>
        </thead>
        <tbody class="all-presets__table-body">
          <tr v-for="(a, idx) in allPresets" :key="idx" class="all-presets__table-row underline">
            <td class="all-presets__cell">
              <InputText
                :id="`presetName-${idx}`"
                :model-value="a.name"
                @update:model-value="handleInputUpdate(idx, 'name', $event.value)"
              />
            </td>
            <td class="all-presets__cell">
              <InputNumber
                :id="`preset-${idx}`"
                :model-value="a.unityParameter"
                @update:model-value="handleInputUpdate(idx, 'unityParameter', $event.value)"
              />
            </td>
            <td class="all-presets__cell all-presets__cell-actions">
              <Button
                label="Apply"
                :small="true"
                :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'apply')"
                @click="handleApply(idx)"
              />
              <Button
                label="Update"
                :small="true"
                :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'update')"
                @click="handleUpdate(idx)"
              />
              <Button
                v-if="!isModal"
                label="Avatar"
                :small="true"
                :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'avatar')"
                @click="handleShowModal(idx)"
              />
              <Button
                label="Delete"
                :small="true"
                :error="failedUpdates.some((fu) => fu.id === a.id && fu.action === 'delete')"
                @click="handleDelete(idx)"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="all-presets__empty">No saved presets.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.all-presets {
  display: flex;
  flex-flow: column;
  gap: 28px;
  height: 100%;
  position: relative;
  overflow: hidden;
  width: 100%;

  &__table-wrapper {
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
