<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Button from '../components/Button.vue'
import Card from '../components/Card.vue'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
import { handleChangeView } from '@renderer/composables/changeView'

let intervalLogUpdate: number | null = null
let cleanupParameterRate: (() => void) | null = null
const logFileSize = ref('0MB')
const saveFaceTracking = ref(false)
const copyForDiscord = ref(false)
const applyConfigBuffer = ref(false)
const updateRate = ref('0 params/sec')
const exportedFiles = ref<{
  fullExports: number
  avatarExports: number
  configExports: number
  totalSize: string
}>({
  fullExports: 0,
  avatarExports: 0,
  configExports: 0,
  totalSize: '0MB'
})

const getLogFileSize = async (): Promise<void> => {
  const size = await window.appApi.getLogFileSize()
  logFileSize.value = size
}

const openExportDirectory = (): void => {
  window.appApi.openExportDirectory()
}

const openLogDirectory = (): void => {
  window.appApi.openLogFile()
}

const deleteLogFile = async (): Promise<void> => {
  const success = await window.appApi.deleteLogFile()

  if (success) {
    logFileSize.value = '0MB'
    emit('notification', {
      type: 'success',
      title: 'Log Deleted'
    })
  } else {
    emit('notification', {
      type: 'error',
      title: 'Log Deletion Failed'
    })
  }
}

const getSaveFaceTrackingSetting = async (): Promise<void> => {
  const setting = await window.appApi.getSaveFaceTrackingSetting()
  saveFaceTracking.value = setting
}

const getCopyForDiscordSetting = async (): Promise<void> => {
  const setting = await window.appApi.getCopyForDiscordSetting()
  copyForDiscord.value = setting
}

const getApplyConfigBufferSetting = async (): Promise<void> => {
  const setting = await window.appApi.getApplyConfigBufferSetting()
  applyConfigBuffer.value = setting
}

const setSaveFaceTrackingSetting = async (): Promise<void> => {
  const newValue = !saveFaceTracking.value
  const res = await window.appApi.setSaveFaceTrackingSetting(newValue)
  saveFaceTracking.value = newValue

  if (res) {
    emit('notification', {
      type: 'success',
      title: 'Save Face Tracking Setting Updated'
    })
  } else {
    emit('notification', {
      type: 'error',
      title: 'Save Face Tracking Setting Update Failed'
    })
  }
}

const setCopyForDiscordSetting = async (): Promise<void> => {
  const newValue = !copyForDiscord.value
  const res = await window.appApi.setCopyForDiscordSetting(newValue)
  copyForDiscord.value = newValue

  if (res) {
    emit('notification', {
      type: 'success',
      title: 'Discord Copy Format Setting Updated'
    })
  } else {
    emit('notification', {
      type: 'error',
      title: 'Discord Copy Format Setting Update Failed'
    })
  }
}

const setApplyConfigBufferSetting = async (): Promise<void> => {
  const newValue = !applyConfigBuffer.value
  const res = await window.appApi.setApplyConfigBufferSetting(newValue)
  applyConfigBuffer.value = newValue

  if (res) {
    emit('notification', {
      type: 'success',
      title: 'Apply Config Buffer Setting Updated'
    })
  } else {
    emit('notification', {
      type: 'error',
      title: 'Apply Config Buffer Setting Update Failed'
    })
  }
}

const paramUpdateRate = (): void => {
  cleanupParameterRate = window.appApi.parameterRateUpdate((rate: string) => {
    updateRate.value = rate
  })
}

const deleteDatabase = async (): Promise<void> => {
  const success = await window.appApi.deleteDatabase()
  emit('notification', {
    type: success ? 'success' : 'error',
    title: success ? 'Database Deleted' : 'Database Deletion Failed'
  })
}

const getExportedFileCount = async (): Promise<void> => {
  const res = await window.appApi.getExportedFileCount()
  exportedFiles.value.fullExports = res.fullExports
  exportedFiles.value.avatarExports = res.avatarExports
  exportedFiles.value.configExports = res.configExports
  exportedFiles.value.totalSize = res.totalSize
}

onMounted(() => {
  getLogFileSize()
  getSaveFaceTrackingSetting()
  getCopyForDiscordSetting()
  getApplyConfigBufferSetting()
  paramUpdateRate()
  getExportedFileCount()
  intervalLogUpdate = window.setInterval(() => {
    getLogFileSize()
  }, 10000)
})

onUnmounted(() => {
  if (intervalLogUpdate !== null) {
    clearInterval(intervalLogUpdate)
  }
  cleanupParameterRate?.()
})

const emit = defineEmits(['notification'])
</script>

<template>
  <div class="settings__wrapper">
    <OverlayScrollbarsComponent
      ref="scrollContainer"
      element="div"
      defer
      :options="{
        scrollbars: {
          autoHide: 'move',
          autoHideDelay: 300
        }
      }"
    >
      <div class="settings">
        <Card>
          <h2 class="settings__title">
            Incoming: <span>{{ updateRate }}</span>
          </h2>
        </Card>
        <div class="settings__cards-row settings__card-row--fit">
          <Card additional-class="card--fit">
            <div class="settings__content">
              <h2 class="settings__title">Log</h2>
              <div class="settings__card-content">
                <p>
                  Log file size: <span>{{ logFileSize }}</span>
                </p>
                <div class="settings__card-button-group">
                  <Button label="Open Log Directory" :small="true" @click="openLogDirectory" />
                  <Button
                    label="Delete"
                    :small="true"
                    :error="true"
                    tooltip="Delete Log"
                    @click="deleteLogFile"
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div class="settings__content">
              <h2 class="settings__title">Export Location</h2>
              <div class="settings__card-content">
                <p>Full Exports: {{ exportedFiles.fullExports }}</p>
                <p>Exported Avatars: {{ exportedFiles.avatarExports }}</p>
                <p>Exported Configs: {{ exportedFiles.configExports }}</p>
                <p>Total Size: {{ exportedFiles.totalSize }}</p>
                <div class="settings__card-button-group">
                  <Button
                    label="Open Export Directory"
                    :small="true"
                    @click="openExportDirectory"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
        <Card>
          <div class="settings__content">
            <h2 class="settings__title">Database</h2>
            <div class="settings__card-content settings__card-content--buttons">
              <Button
                :label="
                  saveFaceTracking ? 'Disable Save Face Tracking' : 'Enable Save Face Tracking'
                "
                :small="true"
                :hero="!saveFaceTracking"
                :error="saveFaceTracking"
                @click="setSaveFaceTrackingSetting"
              />
              <Button
                :label="
                  applyConfigBuffer ? 'Disable Apply Config Buffer' : 'Enable Apply Config Buffer'
                "
                :small="true"
                :hero="!applyConfigBuffer"
                :error="applyConfigBuffer"
                @click="setApplyConfigBufferSetting"
              />
              <Button
                :label="
                  copyForDiscord ? 'Disable Discord Copy Format' : 'Enable Discord Copy Format'
                "
                :small="true"
                :hero="!copyForDiscord"
                :error="copyForDiscord"
                @click="setCopyForDiscordSetting"
              />
              <Button label="Delete Database" :small="true" :error="true" @click="deleteDatabase" />
            </div>
          </div>
        </Card>
        <Card>
          <div class="settings__content">
            <h2 class="settings__title">Terms & Information</h2>
            <div class="settings__card-content">
              <div class="settings__card-button-group">
                <Button label="Terms of Service" :small="true" @click="handleChangeView('Terms')" />
                <Button label="Privacy Policy" :small="true" @click="handleChangeView('Privacy')" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  align-items: center;
  display: flex;
  flex-flow: column nowrap;
  gap: 36px;
  justify-content: center;
  padding-bottom: 22px;
  padding-top: 22px;
  width: 100%;

  &__wrapper {
    display: flex;
    flex-flow: column;
    gap: 28px;
    height: 100%;
    overflow: hidden;
    width: 100%;
  }

  &__content {
    display: flex;
    flex-flow: column;
    gap: 18px;
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  &__cards-row {
    display: flex;
    flex-flow: row;
    gap: 28px;
    justify-content: center;
    width: 100%;

    &--fit {
      height: fit-content;
    }
  }

  &__card-content {
    display: flex;
    flex-flow: column;
    gap: 16px;

    &--buttons {
      align-items: center;
    }
  }

  &__card-button-group {
    display: flex;
    flex-flow: row;
    gap: 8px;
  }
}
</style>
