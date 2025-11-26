<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import Button from '../components/Button.vue'
import LoadAvatarFile from '../components/LoadAvatarFile.vue'
import InputText from '../components/InputText.vue'

const failedUpdates = ref<
  {
    avatarId: string
    action: 'export' | 'delete' | 'update'
  }[]
>([])

const allSaves = ref<Awaited<ReturnType<typeof window.avatarApi.getAllAvatars>>>([])

const getSaves = async (): Promise<void> => {
  allSaves.value = await window.avatarApi.getAllAvatars()
}

const handleUpdate = async (index: number): Promise<void> => {
  failedUpdates.value = failedUpdates.value.filter(
    (id) => id.avatarId !== allSaves.value[index].avatarId
  )

  if (!allSaves.value![index].name || allSaves.value![index].name.trim() === '') {
    failedUpdates.value.push({ avatarId: allSaves.value![index].avatarId, action: 'update' })

    emit('notification', {
      type: 'error',
      title: 'Update Failed',
      text: 'Avatar name cannot be empty.'
    })
    return
  }

  const res = await window.avatarApi.updateAvatarData(
    allSaves.value![index].avatarId,
    allSaves.value![index].name
  )

  let type = 'success'
  let title = 'Update Successful'

  if (!res.success) {
    type = 'error'
    title = 'Update Failed'
    failedUpdates.value.push({ avatarId: allSaves.value![index].avatarId, action: 'update' })
  }

  emit('notification', {
    type: type,
    title: title,
    text: res.message
  })
}

const handleExport = async (index: number): Promise<void> => {
  const res = await window.avatarApi.exportAvatar(allSaves.value[index].avatarId)

  let type = 'success'
  let title = 'Export Successful'
  failedUpdates.value = failedUpdates.value.filter(
    (id) => id.avatarId !== allSaves.value[index].avatarId
  )

  if (!res.success) {
    type = 'error'
    title = 'Export Failed'
    failedUpdates.value.push({ avatarId: allSaves.value[index].avatarId, action: 'export' })
  }

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleDelete = async (index: number): Promise<void> => {
  const res = await window.avatarApi.deleteAvatar(allSaves.value[index].avatarId)

  let type = 'success'
  let title = 'Export Successful'
  failedUpdates.value = failedUpdates.value.filter(
    (id) => id.avatarId !== allSaves.value![index].avatarId
  )

  if (!res.success) {
    type = 'error'
    title = 'Export Failed'
    failedUpdates.value.push({ avatarId: allSaves.value![index].avatarId, action: 'export' })
  }

  getSaves()
  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleInputUpdate = (idx: number, field: 'name', value: string | boolean): void => {
  if (!allSaves.value || allSaves.value.length === 0) return

  const save = allSaves.value[idx]

  if (!save) return
  ;(save[field] as string | boolean) = value
}

onMounted(() => {
  getSaves()
})

const emit = defineEmits(['notification'])
</script>

<template>
  <div class="all-avatars">
    <div class="all-avatars__content">
      <LoadAvatarFile @uploaded="getSaves" @notification="$emit('notification', $event)" />
      <div class="all-avatars__table-wrapper">
        <table v-if="allSaves && allSaves.length" class="all-avatars__table">
          <thead class="all-avatars__table-head">
            <tr class="all-avatars__table-row">
              <th class="all-avatars__table-header underline">Avatar ID</th>
              <th class="all-avatars__table-header underline">Avatar Name</th>
              <th class="all-avatars__table-header underline"></th>
            </tr>
          </thead>
          <tbody class="all-avatars__table-body">
            <tr v-for="(a, idx) in allSaves" :key="idx" class="all-avatars__table-row underline">
              <td class="all-avatars__cell">
                {{ a.avatarId }}
              </td>
              <td class="all-avatars__cell">
                <InputText
                  :id="`avatarName-${idx}`"
                  :model-value="a.name"
                  @update:model-value="handleInputUpdate(idx, 'name', $event.value)"
                />
              </td>
              <td class="all-avatars__cell all-avatars__cell-actions">
                <Button
                  label="Update"
                  :small="true"
                  :error="
                    failedUpdates.some((fu) => fu.avatarId === a.avatarId && fu.action === 'update')
                  "
                  @click="handleUpdate(idx)"
                />
                <Button
                  label="Export"
                  :small="true"
                  :error="
                    failedUpdates.some((fu) => fu.avatarId === a.avatarId && fu.action === 'export')
                  "
                  @click="handleExport(idx)"
                />
                <Button
                  label="Delete"
                  :small="true"
                  :error="
                    failedUpdates.some((fu) => fu.avatarId === a.avatarId && fu.action === 'delete')
                  "
                  @click="handleDelete(idx)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.all-avatars {
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
