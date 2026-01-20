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
import Card from './components/Card.vue'
import PasteCode from './components/PasteCode.vue'
import AllData from './views/AllData.vue'
import Settings from './views/Settings.vue'
import Privacy from './views/Privacy.vue'
import Terms from './views/Terms.vue'
import { InputSelectInterface } from './types/InputSelectInterface'
import type { avatarConfigType } from '../../types/avatarConfigType'
import { NotificationInterface } from './types/notificationInterface'
import { savedNamesType } from './types/savedNamesInterface'
import { appStorage } from './composables/appStorage'
import 'overlayscrollbars/overlayscrollbars.css'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'

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
const NSFWValue = ref(false)
const NSFWError = ref('')

// Load/Apply state
const configSelectValue = ref('')
const configSelectOptions = ref<InputSelectInterface[]>([])

const resetVars = (): void => {
  saveMessage.value = ''
  saveSuccess.value = false
  saveNameError.value = ''
  NSFWError.value = ''
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

const aviConfig = (): void => {
  window.avatarApi.avatarConfig((data) => {
    resetVars()

    avatarConfig.value = data
    if (avatarConfig.value?.valuedParams) {
      avatarConfig.value.valuedParams = undefined
    }

    if (!holdSaveName.value) saveName.value = avatarConfig.value?.name || ''
  })
}

const handleSave = async (): Promise<void> => {
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
    pushNotification({
      type: 'error',
      title: 'Save Failed',
      text: 'No avatar config found'
    })
    return
  }

  holdSaveName.value = true

  const res = await window.avatarApi.saveConfig(
    toRaw(avatarConfig.value),
    NSFWValue.value,
    saveName.value || ''
  )

  saveMessage.value = res?.message || ''
  saveSuccess.value = res?.success || false

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

  pushNotification({
    type: res?.success ? 'success' : 'error',
    title: res?.success ? 'Apply Successful' : 'Apply Failed'
  })
}

const handleCopyCode = async (): Promise<void> => {
  const res = await window.avatarApi.copyConfigCode(Number(configSelectValue.value))

  pushNotification({
    type: res?.success ? 'success' : 'error',
    title: res?.success ? 'Copy Successful' : 'Copy Failed',
    text: res?.message || ''
  })
}

const handleSavedUpdated = async (): Promise<void> => {
  const res = await window.avatarApi.updateConfig(
    Number(configSelectValue.value),
    avatarConfig.value?.avatarId || 'Unknown',
    avatarConfig.value?.avatarName || 'Unknown',
    configSelectOptions.value.find((option) => option.value === Number(configSelectValue.value))
      ?.label || ''
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

const copyAvatarId = async (): Promise<void> => {
  const res = await window.avatarApi.copyAvatarId()

  pushNotification({
    type: res ? 'success' : 'error',
    title: res ? 'Copy Successful' : 'Copy Failed',
    text: ''
  })
}

const handleDelete = async (): Promise<void> => {
  resetVars()
  saveName.value = ''

  const res = await window.avatarApi.deleteConfig(Number(configSelectValue.value))

  pushNotification({
    type: res?.success ? 'success' : 'error',
    title: res?.success ? 'Delete Successful' : 'Delete Failed',
    text: res?.message || ''
  })

  if (res?.success) {
    configSelectValue.value = ''
    savedConfigs()
  }
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
  <Menu />
  <div class="main">
    <AllData v-if="appStore.currentView === 'AllData'" @notification="pushNotification" />
    <Waiting v-if="!appStore.avatarId && appStore.currentView === 'Waiting'" />
    <Settings v-if="appStore.currentView === 'Settings'" @notification="pushNotification" />
    <Privacy v-if="appStore.currentView === 'Privacy'" />
    <Terms v-if="appStore.currentView === 'Terms'" />
    <div v-show="appStore.currentView === 'Main'" class="main__wrapper">
      <div class="main__scroll">
        <OverlayScrollbarsComponent
          element="div"
          defer
          :options="{
            scrollbars: {
              autoHide: 'move',
              autoHideDelay: 300
            }
          }"
        >
          <div class="main__content">
            <Card>
              <div class="main__avatar-data">
                <div class="main__avatar-data-file">
                  <p
                    :class="['main__avatar-found', appStore.avatarFoundFile ? 'success' : 'failed']"
                  >
                    {{
                      appStore.avatarFoundFile ? 'Found avatar data' : 'Could not find avatar data'
                    }}
                  </p>
                  <div v-if="!appStore.avatarFoundFile">
                    <p>Change out of the current avatar to another avatar, then back.</p>
                  </div>
                </div>
                <p v-if="appStore.avatarFoundFile" class="main__avatar-id">
                  Avatar ID: <span class="main__avatar-id__id">{{ appStore.avatarId }}</span>
                </p>
                <p v-if="avatarConfig?.name" class="main__avatar-name">
                  Name: <span class="main__avatar-name__name">{{ avatarConfig?.name }}</span>
                </p>
                <div v-if="appStore.avatarFoundFile">
                  <Button label="Copy Avatar ID" @click="copyAvatarId" />
                </div>
              </div>
            </Card>
            <Card v-if="appStore.avatarFoundFile">
              <div class="main__buttons">
                <div class="main__save-wrapper">
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
                    <Button label="Save Config" :hero="true" @click="handleSave" />
                  </div>
                  <div v-if="saveMessage" class="main__file-saved">
                    <p :class="['main__file-saved', saveSuccess ? 'success' : 'failed']">
                      {{ saveMessage }}
                    </p>
                  </div>
                </div>
                <div v-if="configSelectOptions.length" class="main__saved-wrapper">
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
                    <Button label="Apply" tooltip="Apply selected config" @click="handleApply" />
                    <Button
                      label="Copy Share Code"
                      tooltip="Copy config share code for these settings"
                      @click="handleCopyCode"
                    />
                    <Button
                      label="Update"
                      tooltip="Update selected config with current avatar settings"
                      :warning="true"
                      @click="handleSavedUpdated"
                    />
                    <Button
                      label="Delete"
                      tooltip="Delete selected config"
                      :error="true"
                      @click="handleDelete"
                    />
                  </div>
                </div>
              </div>
            </Card>
            <Card v-if="appStore.avatarFoundFile">
              <PasteCode @notification="pushNotification" />
              <LoadFile
                :avatar-config="avatarConfig"
                :show-id-mismatch="false"
                @notification="pushNotification"
              />
            </Card>
          </div>
        </OverlayScrollbarsComponent>
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
  padding-left: 16px;
  padding-right: 16px;

  &__wrapper {
    height: 100%;
    width: 100%;
  }

  &__scroll {
    display: flex;
    flex-flow: column;
    gap: 28px;
    height: 100%;
    justify-content: center;
    overflow: hidden;
    width: 100%;
  }

  &__content {
    align-items: center;
    display: flex;
    flex-flow: column nowrap;
    gap: 36px;
    justify-content: center;
    padding-bottom: 22px;
    padding-top: 22px;
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
    flex-flow: column;
    gap: 16px;
  }

  &__avatar-found {
    font-weight: 700;
  }

  &__avatar-id,
  &__avatar-name {
    &__id,
    &__name {
      font-weight: 700;
    }
  }

  &__buttons {
    align-items: center;
    display: flex;
    flex-flow: column;
    gap: 18px;
    width: 100%;
  }

  &__save-wrapper,
  &__saved-wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
  }

  &__save {
    white-space: nowrap;
  }

  &__save,
  &__save-exists,
  &__apply-buttons {
    align-items: center;
    display: flex;
    gap: 18px;
    justify-content: center;
  }

  &__file-saved {
    font-weight: 700;
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

.os-theme-dark {
  --os-handle-bg: linear-gradient(135deg, rgba(63, 81, 102, 0.4) 0%, rgba(47, 90, 145, 0.4) 100%);
  --os-handle-bg-hover: linear-gradient(
    135deg,
    rgba(63, 81, 102, 0.7) 0%,
    rgba(47, 90, 145, 0.7) 100%
  );
  --os-handle-bg-active: linear-gradient(
    135deg,
    rgba(63, 81, 102, 0.7) 0%,
    rgba(47, 90, 145, 0.7) 100%
  );
}
</style>
