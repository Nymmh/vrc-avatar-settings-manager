<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import Button from './Button.vue'
import InputCheckbox from './InputCheckbox.vue'
import InputText from './InputText.vue'
import type { avatarConfigType } from '../../../types/avatarConfigType'

const props = defineProps({
  avatarConfig: {
    type: Object as () => avatarConfigType | null,
    default: null
  },
  showSave: {
    type: Boolean,
    default: true
  },
  showIdMismatch: {
    type: Boolean,
    default: true
  },
  directUpload: {
    type: Boolean,
    default: false
  },
  showNsfwOption: {
    type: Boolean,
    default: false
  }
})

const avatarName = computed(() => props.avatarConfig?.name || 'unknown')

const loadedConfigName = ref('')
const loadConfigError = ref('')
const avatarIdMatch = ref(true)
const loadConfigSaveName = ref('')
const loadConfigSaveOption = ref(true)
const loadConfigSaveError = ref('')
const uploadStatus = ref(false)
const showUploadStatus = ref(false)
const NSFWValue = ref(false)
const DirectUploadId = ref('')
const loadConfigSaveNameError = ref('')

const resetVars = (): void => {
  loadedConfigName.value = ''
  uploadStatus.value = false
  showUploadStatus.value = false
  avatarIdMatch.value = true
  loadConfigError.value = ''
  loadConfigSaveOption.value = true
  loadConfigSaveName.value = ''
  loadConfigSaveError.value = ''
  NSFWValue.value = false
  DirectUploadId.value = ''
  loadConfigSaveNameError.value = ''
}

const handleLoad = async (): Promise<void> => {
  resetVars()
  const res = await window.avatarApi.loadConfig()

  if (!res) return

  loadedConfigName.value = res.name
  loadConfigSaveName.value = res.name
  avatarIdMatch.value = res.match
  loadConfigError.value = res.error || ''
}

const handleUpload = async (): Promise<void> => {
  if (props.directUpload) {
    loadConfigSaveOption.value = true
  }

  if (!loadConfigSaveName.value.trim()) {
    loadConfigSaveNameError.value = 'Enter a valid save name'

    emit('notification', {
      type: 'error',
      title: 'Upload Failed',
      text: 'Enter a valid save name'
    })

    return
  }

  let res:
    | Awaited<ReturnType<typeof window.avatarApi.uploadConfig>>
    | Awaited<ReturnType<typeof window.avatarApi.uploadConfigAndApply>>

  if (props.directUpload) {
    res = await window.avatarApi.uploadConfig(
      loadConfigSaveName.value,
      NSFWValue.value,
      DirectUploadId.value || ''
    )
  } else {
    res = await window.avatarApi.uploadConfigAndApply(
      loadConfigSaveName.value,
      loadConfigSaveOption.value,
      avatarName.value
    )
  }

  resetVars()
  uploadStatus.value = res.upload
  loadConfigSaveError.value = res.saveMessage || ''
  showUploadStatus.value = true

  emit('notification', {
    type: res.upload ? 'success' : 'error',
    title: res.upload ? 'Upload Successful' : 'Upload Failed',
    text: res.saveMessage || ''
  })

  if (res.upload) emit('uploaded')
}

const handleInputUpdate = ({ id, value, checked }): void => {
  if (id == 'load-name-input') {
    loadConfigSaveName.value = value
  } else if (id == 'load-save') {
    loadConfigSaveOption.value = checked
  } else if (id == 'load-nsfw') {
    NSFWValue.value = checked
  } else if (id == 'direct-upload-id') {
    DirectUploadId.value = value
  }
}

onMounted(() => {
  resetVars()
})

const emit = defineEmits(['notification', 'uploaded'])
</script>

<template>
  <div class="load-file">
    <Button label="Load From File" @click="handleLoad" />
    <p v-if="loadedConfigName" class="load-file__loaded-config">
      Loaded config: <span class="load-file__loaded-config__file">{{ loadedConfigName }}</span>
    </p>
    <p
      v-if="!avatarIdMatch && !loadConfigError && showIdMismatch"
      class="load-file__loaded-config-match failed"
    >
      Config ID does not match Avatar ID
    </p>
    <p v-if="loadConfigError" class="failed">
      {{ loadConfigError }}
    </p>
    <div
      v-if="directUpload && loadedConfigName && !loadConfigError"
      class="load-file__direct-upload-options"
    >
      <InputText
        id="direct-upload-id"
        label="Avatar ID: "
        placeholder="Avatar ID"
        :model-value="DirectUploadId"
        @update:model-value="handleInputUpdate"
      />
    </div>
    <div v-if="loadedConfigName && !loadConfigError" class="load-file__load-options">
      <InputText
        id="load-name-input"
        label="Save Name: "
        :model-value="loadConfigSaveName"
        :error="loadConfigSaveNameError"
        @update:model-value="handleInputUpdate"
      />
      <InputCheckbox
        v-if="showSave"
        id="load-save"
        label="Save"
        :model-value="loadConfigSaveOption"
        @update:model-value="handleInputUpdate"
      />
      <InputCheckbox
        v-if="showNsfwOption"
        id="load-nsfw"
        label="NSFW"
        :model-value="NSFWValue"
        @update:model-value="handleInputUpdate"
      />
    </div>
    <Button v-if="loadedConfigName && !loadConfigError" label="Upload" @click="handleUpload" />
    <p v-if="showUploadStatus" class="load-file__upload-status">
      Upload Status:
      <span :class="['load-file__upload-status-label', uploadStatus ? 'success' : 'failed']">
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
.load-file {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  &__loaded-config__file,
  &__upload-status-label {
    font-weight: bold;
  }

  &__direct-upload-options {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  &__load-options {
    align-items: center;
    display: flex;
    gap: 16px;
    justify-content: center;
  }
}
</style>
