<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue'
import Button from './components/Button.vue'
import Footer from './components/Footer.vue'
import InputCheckbox from './components/InputCheckbox.vue'
import InputSelect from './components/InputSelect.vue'
import InputText from './components/InputText.vue'
// import Waiting from './components/Waiting.vue'
import { InputSelectInterface } from './types/InputSelectInterface'

import type { avatarConfigType } from '../../types/avatarConfigType'

// Avatar state
const avatarId = ref('')
const avatarFoundFile = ref(false)
const showAvatarFoundFileMsg = ref(false)
const avatarConfig = ref<avatarConfigType | null>(null)
const avatarIdMatch = ref(true)

// Save state
const saveName = ref('')
const saveNameError = ref('')
const saveMessage = ref('')
const saveSuccess = ref(false)
const saveError = ref('')
const NSFWValue = ref(false)
const NSFWError = ref('')

// Load/Apply state
const configSelectValue = ref('')
const configSelectOptions = ref<InputSelectInterface[]>([])
const applyStatus = ref<boolean | undefined>(undefined)
const loadedConfigName = ref('')
const loadConfigError = ref('')
const loadConfigSaveName = ref('')
const loadConfigSaveOption = ref(true)
const loadConfigSaveError = ref('')

// Upload state
const uploadStatus = ref(false)
const showUploadStatus = ref(false)

const resetVars = (): void => {
  saveMessage.value = ''
  saveSuccess.value = false
  saveError.value = ''
  saveNameError.value = ''
  NSFWError.value = ''
  loadedConfigName.value = ''
  uploadStatus.value = false
  showUploadStatus.value = false
  avatarIdMatch.value = true
  applyStatus.value = undefined
  loadConfigError.value = ''
  loadConfigSaveOption.value = true
  loadConfigSaveName.value = ''
  loadConfigSaveError.value = ''
}

const getAvatarId = (): void => {
  avatarId.value = ''
  saveName.value = ''
  resetVars()

  window.avatarApi.avatarId((data) => {
    avatarId.value = data.id
  })
}

const savedConfigs = async (): Promise<void> => {
  await window.avatarApi.savedNames((data) => {
    configSelectOptions.value = data.map((name: string) => ({
      label: name,
      value: name
    }))
  })
}

const aviFileUpdate = (): void => {
  avatarFoundFile.value = false
  showAvatarFoundFileMsg.value = false
  saveName.value = ''
  resetVars()

  window.avatarApi.foundAvatarFile((data) => {
    avatarFoundFile.value = data.success
    showAvatarFoundFileMsg.value = true
  })
}

const refreshAviFile = async (): Promise<void> => {
  avatarFoundFile.value = false
  showAvatarFoundFileMsg.value = false
  saveName.value = ''

  const res = await window.avatarApi.refreshAvatarFile()
  avatarFoundFile.value = res.success
  showAvatarFoundFileMsg.value = true
}

const aviConfig = (): void => {
  window.avatarApi.avatarConfig((data) => {
    resetVars()

    avatarConfig.value = data
    saveName.value = avatarConfig.value?.name || ''
  })
}

const handleSave = async (overwrite: boolean): Promise<void> => {
  resetVars()

  if (!saveName.value.trim()) {
    saveMessage.value = 'Enter a valid save name'
    return
  }

  if (!avatarConfig.value) {
    saveError.value = 'No avatar config found'
    return
  }

  if (!overwrite) saveError.value = ''

  const res = await window.avatarApi.saveConfig(
    toRaw(avatarConfig.value),
    overwrite,
    NSFWValue.value
  )

  saveMessage.value = res?.message || ''
  saveSuccess.value = res?.success || false
  saveError.value = res?.overwriteMessage || ''
}

const handleLoad = async (): Promise<void> => {
  resetVars()
  saveName.value = ''
  const res = await window.avatarApi.loadConfig()

  if (!res) return

  loadedConfigName.value = res.name
  loadConfigSaveName.value = res.name
  avatarIdMatch.value = res.match
  loadConfigError.value = res.error || ''
}

const handleApply = async (): Promise<void> => {
  resetVars()
  saveName.value = ''

  const res = await window.avatarApi.applyConfig(configSelectValue.value)
  applyStatus.value = !!res?.success
}

const handleUpload = async (): Promise<void> => {
  saveName.value = ''
  const res = await window.avatarApi.uploadConfigAndApply(
    loadConfigSaveName.value,
    loadConfigSaveOption.value,
    avatarConfig.value?.name || 'Unknown'
  )

  resetVars()
  uploadStatus.value = res.upload
  loadConfigSaveError.value = res.saveMessage || ''
  showUploadStatus.value = true
}

const handleInputUpdate = ({ id, value, checked }): void => {
  if (id == 'config-name-input') {
    saveName.value = value
  } else if (id == 'config-nsfw') {
    NSFWValue.value = checked
  } else if (id == 'select-config') {
    configSelectValue.value = value
  } else if (id == 'load-name-input') {
    loadConfigSaveName.value = value
  } else if (id == 'load-save') {
    loadConfigSaveOption.value = checked
  }
}
onMounted(() => {
  avatarId.value = ''
  avatarFoundFile.value = false
  showAvatarFoundFileMsg.value = false
  saveName.value = ''
  resetVars()
  getAvatarId()
  aviFileUpdate()
  savedConfigs()
  aviConfig()
})
</script>

<template>
  <div class="main">
    <!-- <Waiting v-if="!avatarId" /> -->
    <div class="main__content">
      <div :class="['main__avatar-data', { underline: avatarFoundFile }]">
        <div class="main__avatar-data-file">
          <p :class="['main__avatar-found', avatarFoundFile ? 'success' : 'failed']">
            {{ avatarFoundFile ? 'Found avatar data' : 'Could not find avatar data' }}
          </p>
          <Button v-if="!avatarFoundFile" :small="true" label="Refresh" @click="refreshAviFile" />
        </div>
        <p v-if="avatarFoundFile" class="main__avatar-id">
          Avatar ID: <span class="main__avatar-id__id">{{ avatarId }}</span>
        </p>
        <p v-if="avatarConfig?.name" class="main__avatar-name">
          Name: <span class="main__avatar-name__name">{{ avatarConfig?.name }}</span>
        </p>
      </div>
      <div v-if="avatarFoundFile" class="main__buttons">
        <div class="main__save-wrapper underline">
          <div class="main__save">
            <InputText
              id="config-name-input"
              label="Save Name: "
              :error="saveNameError"
              :model-value="saveName"
              @update:model-value="handleInputUpdate"
            />
            <InputCheckbox
              id="config-nsfw"
              label="NSFW"
              :error="NSFWError"
              :model-value="NSFWValue"
              @update:model-value="handleInputUpdate"
            />
            <Button label="Save Config" @click="handleSave(false)" />
          </div>
          <div v-if="saveError" class="main__save-exists">
            <p class="failed">{{ saveError }}</p>
            <Button label="Overwrite" @click="handleSave(true)" />
          </div>
          <div v-if="saveMessage" class="main__file-saved">
            <p :class="['main__file-saved', saveSuccess ? 'success' : 'failed']">
              {{ saveMessage }}
            </p>
          </div>
        </div>
        <div v-if="configSelectOptions.length" class="main__saved-wrapper underline">
          <div class="main__saved-current-avi">
            <InputSelect
              id="select-config"
              label="Saved Configs: "
              :model-value="configSelectValue"
              :options="configSelectOptions"
              @update:model-value="handleInputUpdate"
            />
          </div>
          <Button v-if="configSelectValue" label="Apply" @click="handleApply" />
          <p
            v-if="applyStatus !== undefined"
            :class="['main__saved-message', applyStatus ? 'success' : 'failed']"
          >
            {{ applyStatus ? 'Config applied' : 'Failed to apply config' }}
          </p>
        </div>
        <div class="main__load-file-wrapper">
          <Button label="Load From File" @click="handleLoad" />
          <p v-if="loadedConfigName" class="main__loaded-config">
            Loaded config: <span class="main__loaded-config__file">{{ loadedConfigName }}</span>
          </p>
          <p v-if="!avatarIdMatch && !loadConfigError" class="main__loaded-config-match failed">
            Config ID does not match Avatar ID
          </p>
          <p v-if="loadConfigError" class="failed">
            {{ loadConfigError }}
          </p>
          <div v-if="loadedConfigName && !loadConfigError" class="main__load-options">
            <InputText
              id="load-name-input"
              label="Save Name: "
              :model-value="loadConfigSaveName"
              @update:model-value="handleInputUpdate"
            />
            <InputCheckbox
              id="load-save"
              label="Save"
              :model-value="loadConfigSaveOption"
              @update:model-value="handleInputUpdate"
            />
          </div>
          <Button
            v-if="loadedConfigName && !loadConfigError"
            label="Upload"
            @click="handleUpload"
          />
          <p v-if="showUploadStatus" class="main__upload-status">
            Upload Status:
            <span :class="['main__upload-status__status', uploadStatus ? 'success' : 'failed']">
              {{ uploadStatus ? 'Success' : 'Failed' }}
            </span>
          </p>
          <p
            v-if="loadConfigSaveError"
            :class="['main__upload-save', loadConfigSaveError === 'Saved' ? 'success' : 'failed']"
          >
            {{ loadConfigSaveError }}
          </p>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</template>

<style lang="scss">
@use './styles/global.scss';

.main {
  align-items: center;
  display: flex;
  flex-flow: column;
  gap: 16px;
  height: 94%;
  justify-content: center;

  &__content {
    width: 100%;
  }

  &__avatar-data {
    align-items: center;
    display: flex;
    flex-flow: column;
    gap: 16px;
    justify-content: center;
    width: 100%;
  }

  &__avatar-data-file {
    align-items: center;
    display: flex;
    gap: 16px;
  }

  &__avatar-id,
  &__avatar-name {
    &__id,
    &__name {
      font-weight: bold;
    }
  }

  &__buttons {
    align-items: center;
    display: flex;
    flex-flow: column;
    gap: 16px;
    padding-top: 16px;
    width: 100%;
  }

  &__save-wrapper,
  &__saved-wrapper,
  &__load-file-wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  &__save,
  &__save-exists,
  &__load-options {
    align-items: center;
    display: flex;
    gap: 16px;
    justify-content: center;
  }

  &__loaded-config__file,
  &__upload-status__status {
    font-weight: bold;
  }
}
</style>
