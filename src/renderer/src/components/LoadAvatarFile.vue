<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import Button from './Button.vue'

const loadedConfigName = ref('')
const loadConfigSaveName = ref('')
const loadConfigSaveError = ref('')
const uploadStatus = ref(false)
const showUploadStatus = ref(false)

const resetVars = (): void => {
  loadedConfigName.value = ''
  uploadStatus.value = false
  showUploadStatus.value = false
  loadConfigSaveName.value = ''
  loadConfigSaveError.value = ''
}

const handleLoad = async (): Promise<void> => {
  resetVars()
  const res = await window.avatarApi.loadAvatarConfig()

  if (!res) return

  loadedConfigName.value = res.name
}

const handleUpload = async (): Promise<void> => {
  let res: Awaited<ReturnType<typeof window.avatarApi.uploadAvatarConfig>>

  res = await window.avatarApi.uploadAvatarConfig()

  resetVars()
  uploadStatus.value = res.success
  loadConfigSaveError.value = res.message || ''
  showUploadStatus.value = true

  emit('notification', {
    type: res.success ? 'success' : 'error',
    title: res.success ? 'Upload Successful' : 'Upload Failed',
    text: res.message || ''
  })

  if (res.success) emit('uploaded')
}

onMounted(() => {
  resetVars()
})

const emit = defineEmits(['notification', 'uploaded'])
</script>

<template>
  <div class="load-avatar-file">
    <Button label="Upload From File" @click="handleLoad" />
    <p v-if="loadedConfigName" class="load-file__loaded-config">
      Loaded config: <span class="load-file__loaded-config__file">{{ loadedConfigName }}</span>
    </p>
    <Button v-if="loadedConfigName" label="Upload" @click="handleUpload" />
    <p v-if="showUploadStatus" class="load-avatar-file__upload-status">
      Upload Status:
      <span :class="['load-avatar-file__upload-status-label', uploadStatus ? 'success' : 'failed']">
        {{ uploadStatus ? 'Success' : 'Failed' }}
      </span>
    </p>
    <p
      v-if="loadConfigSaveError"
      :class="['load-file__upload-save', loadConfigSaveError === 'Saved' ? 'success' : 'failed']"
    >
      {{ loadConfigSaveError }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.load-avatar-file {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  &__loaded-config__file,
  &__upload-status-label {
    font-weight: bold;
  }
}
</style>
