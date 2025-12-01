<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue'
import { useNotification } from '@kyvg/vue3-notification'
import Button from './components/Button.vue'
import Footer from './components/Footer.vue'
import InputCheckbox from './components/InputCheckbox.vue'
import InputSelect from './components/InputSelect.vue'
import InputText from './components/InputText.vue'
import LoadFile from './components/LoadFile.vue'
import Menu from './components/Menu.vue'
import Waiting from './components/Waiting.vue'
import { InputSelectInterface } from './types/InputSelectInterface'
import type { avatarConfigType } from '../../types/avatarConfigType'
import { NotificationInterface } from './types/notificationInterface'
import { savedNamesType } from './types/savedNamesInterface'
import { appStorage } from './composables/appStorage'
import AllData from './views/AllData.vue'

const appStore = appStorage()
const { notify } = useNotification()

// Avatar state
const showAvatarFoundFileMsg = ref(false)
const avatarConfig = ref<avatarConfigType | null>(null)
const holdSaveName = ref(false)

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

const resetVars = (): void => {
  saveMessage.value = ''
  saveSuccess.value = false
  saveError.value = ''
  saveNameError.value = ''
  NSFWError.value = ''
  applyStatus.value = undefined
}

const pushNotification = (data: NotificationInterface): void => {
  notify({
    type: data.type,
    title: data.title,
    text: data.text || ''
  })
}

const getAvatarId = (): void => {
  window.avatarApi.avatarId((data) => {
    appStore.value.avatarId = ''
    saveName.value = ''
    holdSaveName.value = false
    resetVars()
    if (appStore.value.currentView === 'Waiting' && data.id) {
      appStore.value.currentView = 'Main'
    }
    appStore.value.avatarId = data.id
  })
}

const savedConfigs = async (): Promise<void> => {
  await window.avatarApi.savedNames((data: savedNamesType[]) => {
    configSelectOptions.value = data.map(({ id, name }) => ({
      label: name,
      value: id
    }))
  })
}

const aviFileUpdate = (): void => {
  appStore.value.avatarFoundFile = false
  showAvatarFoundFileMsg.value = false
  if (!holdSaveName.value) saveName.value = ''
  resetVars()

  window.avatarApi.foundAvatarFile((data) => {
    appStore.value.avatarFoundFile = data.success
    showAvatarFoundFileMsg.value = true
  })
}

const refreshAviFile = async (): Promise<void> => {
  appStore.value.avatarFoundFile = false
  showAvatarFoundFileMsg.value = false
  if (!holdSaveName.value) saveName.value = ''

  const res = await window.avatarApi.refreshAvatarFile()
  appStore.value.avatarFoundFile = res.success
  showAvatarFoundFileMsg.value = true

  if (!res.success) {
    pushNotification({
      type: 'error',
      title: 'Refresh Failed'
    })
  }
}

const aviConfig = (): void => {
  window.avatarApi.avatarConfig((data) => {
    resetVars()

    avatarConfig.value = data
    if (!holdSaveName.value) saveName.value = avatarConfig.value?.name || ''
  })
}

const handleSave = async (overwrite: boolean): Promise<void> => {
  resetVars()

  if (!saveName.value.trim()) {
    saveMessage.value = 'Enter a valid save name'

    pushNotification({
      type: 'error',
      title: 'Save Failed',
      text: 'Enter a valid save name'
    })
    return
  }

  if (!avatarConfig.value) {
    saveError.value = 'No avatar config found'

    pushNotification({
      type: 'error',
      title: 'Save Failed',
      text: 'No avatar config found'
    })
    return
  }

  if (!overwrite) saveError.value = ''
  holdSaveName.value = true

  const res = await window.avatarApi.saveConfig(
    toRaw(avatarConfig.value),
    NSFWValue.value,
    saveName.value || ''
  )

  saveMessage.value = res?.message || ''
  saveSuccess.value = res?.success || false
  saveError.value = res?.overwriteMessage || ''

  if (res?.message) {
    pushNotification({
      type: res?.success ? 'success' : 'error',
      title: res?.success ? 'Save Successful' : 'Save Failed',
      text: res.message
    })
  }

  if (res?.overwriteMessage) {
    pushNotification({
      type: res?.success ? 'success' : 'error',
      title: res?.success ? 'Save Successful' : 'Save Failed',
      text: res.overwriteMessage
    })
  }
}

const handleApply = async (): Promise<void> => {
  resetVars()
  saveName.value = ''

  const res = await window.avatarApi.applyConfig(Number(configSelectValue.value))
  applyStatus.value = !!res?.success

  pushNotification({
    type: res?.success ? 'success' : 'error',
    title: res?.success ? 'Apply Successful' : 'Apply Failed'
  })
}

const handleSavedUpdated = async (): Promise<void> => {
  const res = await window.avatarApi.updateConfig(
    Number(configSelectValue.value),
    avatarConfig.value?.avatarId || 'Unknown',
    avatarConfig.value?.avatarName || 'Unknown',
    avatarConfig.value?.name
  )
  if (!res.success) {
    pushNotification({
      type: 'error',
      title: 'Update Failed',
      text: res.message
    })
    return
  }

  pushNotification({
    type: 'success',
    title: 'Update Successful',
    text: res.message
  })
}

const handleInputUpdate = ({ id, value, checked }): void => {
  if (id == 'config-name-input') {
    saveName.value = value
  } else if (id == 'config-nsfw') {
    NSFWValue.value = checked
  } else if (id == 'select-config') {
    configSelectValue.value = value
  }
}

onMounted(() => {
  appStore.value.avatarId = ''
  appStore.value.avatarFoundFile = false
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
  <notifications class="notification" position="bottom left" />
  <Menu :current-view="appStore.currentView" />
  <div class="main">
    <AllData v-if="appStore.currentView === 'AllData'" @notification="pushNotification" />
    <Waiting v-if="!appStore.avatarId && appStore.currentView === 'Waiting'" />
    <div v-show="appStore.currentView === 'Main'" class="main__content">
      <div :class="['main__avatar-data', { underline: appStore.avatarFoundFile }]">
        <div class="main__avatar-data-file">
          <p :class="['main__avatar-found', appStore.avatarFoundFile ? 'success' : 'failed']">
            {{ appStore.avatarFoundFile ? 'Found avatar data' : 'Could not find avatar data' }}
          </p>
          <Button
            v-if="!appStore.avatarFoundFile"
            :small="true"
            label="Refresh"
            @click="refreshAviFile"
          />
        </div>
        <p v-if="appStore.avatarFoundFile" class="main__avatar-id">
          Avatar ID: <span class="main__avatar-id__id">{{ appStore.avatarId }}</span>
        </p>
        <p v-if="avatarConfig?.name" class="main__avatar-name">
          Name: <span class="main__avatar-name__name">{{ avatarConfig?.name }}</span>
        </p>
      </div>
      <div v-if="appStore.avatarFoundFile" class="main__buttons">
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
          <div v-if="configSelectValue" class="main__apply-buttons">
            <Button label="Apply" @click="handleApply" />
            <Button label="Update" @click="handleSavedUpdated" />
          </div>

          <p
            v-if="applyStatus !== undefined"
            :class="['main__saved-message', applyStatus ? 'success' : 'failed']"
          >
            {{ applyStatus ? 'Config applied' : 'Failed to apply config' }}
          </p>
        </div>
        <LoadFile :avatar-config="avatarConfig" @notification="pushNotification" />
      </div>
    </div>
  </div>
  <Footer @notification="pushNotification" />
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
  overflow: hidden;

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
  &__saved-wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  &__save,
  &__save-exists,
  &__apply-buttons {
    align-items: center;
    display: flex;
    gap: 16px;
    justify-content: center;
  }
}

.notification {
  .vue-notification-template {
    font-size: 1rem;
  }

  .success {
    color: var(--color--primary-a1);
  }
}
</style>
