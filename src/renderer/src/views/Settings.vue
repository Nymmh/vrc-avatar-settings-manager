<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { appStorage } from '../composables/appStorage'
import { handleChangeView } from '@renderer/composables/changeView'
import Icon from '../components/Icon.vue'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'

const appStore = appStorage()

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

const settingsScrollOverlayProps = {
  element: 'div',
  defer: true,
  options: {
    scrollbars: {
      autoHide: 'move',
      autoHideDelay: 300
    }
  }
}

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

  if (res) {
    saveFaceTracking.value = newValue
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

  if (res) {
    copyForDiscord.value = newValue
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

  if (res) {
    applyConfigBuffer.value = newValue
    emit('notification', {
      type: 'success',
      title: 'Config Buffer Setting Updated'
    })
  } else {
    emit('notification', {
      type: 'error',
      title: 'Config Buffer Setting Update Failed'
    })
  }
}

const setLowPerformanceModeSetting = async (): Promise<void> => {
  const newValue = !appStore.value.lowPerformanceMode
  const res = await window.appApi.setLowPerformanceModeSetting(newValue)

  if (res) {
    appStore.value.lowPerformanceMode = newValue
    emit('notification', {
      type: 'success',
      title: 'Low Performance Mode Setting Updated'
    })
  } else {
    emit('notification', {
      type: 'error',
      title: 'Low Performance Mode Setting Update Failed'
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

const handleExport = async (): Promise<void> => {
  const res = await window.avatarApi.exportAllConfigs()

  let type = 'success'
  let title = 'Export Successful'

  if (!res.success) {
    type = 'error'
    title = 'Export Failed'
  }

  getExportedFileCount()

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

const handleImport = async (): Promise<void> => {
  const res = await window.avatarApi.importAllConfigs()

  let type = 'success'
  let title = 'Import Successful'

  if (!res.success) {
    type = 'error'
    title = 'Import Failed'
  }

  appStore.value.dataTableRefresh = true

  emit('notification', {
    type,
    title,
    text: res.message
  })
}

onMounted(() => {
  getLogFileSize()
  getSaveFaceTrackingSetting()
  getCopyForDiscordSetting()
  getApplyConfigBufferSetting()
  void window.appApi.getLowPerformanceModeSetting().then((value) => {
    appStore.value.lowPerformanceMode = value
  })
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

const openTerms = (): void => {
  handleChangeView('Terms')
}

const openPrivacy = (): void => {
  handleChangeView('Privacy')
}

const emit = defineEmits(['notification'])
</script>

<template>
  <div
    :class="[
      'settings__wrapper',
      { 'settings__wrapper--low-performance': appStore.lowPerformanceMode }
    ]"
  >
    <component
      :is="appStore.lowPerformanceMode ? 'div' : OverlayScrollbarsComponent"
      v-bind="appStore.lowPerformanceMode ? {} : settingsScrollOverlayProps"
    >
      <div class="settings">
        <div class="settings__row settings__row--three">
          <section class="settings__card">
            <div class="settings__heading">
              <span class="settings__icon"><Icon name="database" :size="25" /></span>
              <div>
                <h2>Data Management</h2>
                <p>Export or import all avatar data, configurations and settings.</p>
              </div>
            </div>
            <div class="settings__actions">
              <button class="settings__action" @click="handleExport">
                <Icon name="upload" />Export All
              </button>
              <button class="settings__action" @click="handleImport">
                <Icon name="download" />Import All
              </button>
            </div>
          </section>

          <section class="settings__card">
            <div class="settings__heading">
              <span class="settings__icon"><Icon name="folder" :size="25" /></span>
              <div><h2>Export Location</h2></div>
            </div>
            <dl class="settings__stats">
              <div>
                <dt>Full Exports</dt>
                <dd>{{ exportedFiles.fullExports }}</dd>
              </div>
              <div>
                <dt>Exported Avatars</dt>
                <dd>{{ exportedFiles.avatarExports }}</dd>
              </div>
              <div>
                <dt>Exported Configs</dt>
                <dd>{{ exportedFiles.configExports }}</dd>
              </div>
              <div>
                <dt>Total Size</dt>
                <dd>{{ exportedFiles.totalSize }}</dd>
              </div>
            </dl>
            <div class="settings__actions settings__actions--divider">
              <button class="settings__action" @click="openExportDirectory">
                <Icon name="folder" />Open Export Directory
              </button>
            </div>
          </section>

          <section class="settings__card">
            <div class="settings__heading">
              <span class="settings__icon"><Icon name="file" :size="25" /></span>
              <div>
                <h2>Log</h2>
                <p>Log file size: {{ logFileSize }}</p>
              </div>
            </div>
            <div class="settings__actions">
              <button class="settings__action" @click="openLogDirectory">
                <Icon name="folder" />Open Log Directory
              </button>
              <button class="settings__action settings__action--danger" @click="deleteLogFile">
                <Icon name="trash" />Delete Log
              </button>
            </div>
          </section>
        </div>

        <div class="settings__row settings__row--two">
          <section class="settings__card">
            <div class="settings__heading">
              <span class="settings__icon"><Icon name="gear" :size="25" /></span>
              <div>
                <h2>Application</h2>
                <p>Application behavior and performance settings. Incoming: {{ updateRate }}</p>
              </div>
            </div>
            <div class="settings__toggle-row">
              <div>
                <strong>Enable Config Buffer</strong
                ><small>Temporarily store configuration data to improve stability.</small>
              </div>
              <button
                class="settings__switch"
                type="button"
                role="switch"
                :aria-checked="applyConfigBuffer"
                aria-label="Enable Config Buffer"
                @click="setApplyConfigBufferSetting"
              >
                <span />
              </button>
            </div>
            <div class="settings__toggle-row">
              <div>
                <strong>Disable Discord Copy Format</strong
                ><small>Use plain text when copying to clipboard.</small>
              </div>
              <button
                class="settings__switch"
                type="button"
                role="switch"
                :aria-checked="!copyForDiscord"
                aria-label="Disable Discord Copy Format"
                @click="setCopyForDiscordSetting"
              >
                <span />
              </button>
            </div>
            <div class="settings__toggle-row">
              <div>
                <strong>Disable Low Performance Mode</strong
                ><small>Keep full performance features enabled.</small>
              </div>
              <button
                class="settings__switch"
                type="button"
                role="switch"
                :aria-checked="!appStore.lowPerformanceMode"
                aria-label="Disable Low Performance Mode"
                @click="setLowPerformanceModeSetting"
              >
                <span />
              </button>
            </div>
          </section>

          <section class="settings__card">
            <div class="settings__heading">
              <span class="settings__icon"><Icon name="database" :size="25" /></span>
              <div>
                <h2>Database</h2>
                <p>Saved data and tracking options.</p>
              </div>
            </div>
            <div class="settings__toggle-row">
              <div>
                <strong>Enable Save Face Tracking</strong
                ><small>Save face tracking data with configurations.</small>
              </div>
              <button
                class="settings__switch"
                type="button"
                role="switch"
                :aria-checked="saveFaceTracking"
                aria-label="Enable Save Face Tracking"
                @click="setSaveFaceTrackingSetting"
              >
                <span />
              </button>
            </div>
            <button
              class="settings__action settings__action--danger settings__action--delete-database"
              @click="deleteDatabase"
            >
              <Icon name="trash" :size="23" />
              <span
                ><strong>Delete Database</strong
                ><small>Permanently delete saved data, configurations and settings.</small></span
              >
            </button>
          </section>
        </div>

        <section class="settings__card settings__card--terms">
          <div class="settings__heading">
            <span class="settings__icon"><Icon name="file" :size="25" /></span>
            <div>
              <h2>Terms &amp; Information</h2>
              <p>View the application's terms of service and privacy policy.</p>
            </div>
          </div>
          <div class="settings__actions">
            <button class="settings__action" @click="openTerms">
              Terms of Service<Icon name="external" :size="17" />
            </button>
            <button class="settings__action" @click="openPrivacy">
              Privacy Policy<Icon name="external" :size="17" />
            </button>
          </div>
        </section>
      </div>
    </component>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: grid;
  gap: 22px;
  width: 100%;
  padding: 4px 2px 24px;
  color: var(--asm-text);

  &__wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  &__wrapper > * {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  &__wrapper--low-performance {
    overflow: auto;
  }
  &__row {
    display: grid;
    gap: 22px;
    min-width: 0;
  }
  &__row--three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  &__row--two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  &__card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 22px;
    padding: 24px;
    border: 1px solid var(--color--card-glass-border);
    border-radius: 14px;
    background: var(--asm-panel);
  }
  &__heading {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    min-width: 0;
  }
  &__heading h2 {
    margin: 5px 0 8px;
    font-size: 1.12rem;
    font-weight: 700;
  }
  &__heading p {
    margin: 0;
    color: var(--asm-muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }
  &__icon {
    display: inline-flex;
    flex: 0 0 52px;
    align-items: center;
    justify-content: center;
    height: 52px;
    border-radius: 10px;
    background: var(--color--primary-a6);
  }
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: auto;
  }
  &__actions--divider {
    padding-top: 16px;
    border-top: 1px solid var(--color--card-glass-border);
  }
  &__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 44px;
    padding: 10px 16px;
    border: 0;
    border-radius: 10px;
    background: var(--color--low-button);
    color: var(--asm-text);
    cursor: pointer;
  }
  &__action:hover {
    background: var(--color--low-button-hover);
  }
  &__action--danger {
    background: var(--color--low-error);
  }
  &__action--danger:hover {
    background: var(--color--low-error-hover);
  }
  &__action:active {
    filter: brightness(0.85);
  }
  &__stats {
    display: grid;
    gap: 8px;
    margin: 0;
  }
  &__stats > div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  &__stats dt,
  &__stats dd {
    margin: 0;
  }
  &__stats dd {
    color: var(--asm-muted);
  }
  &__toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding-top: 13px;
    border-top: 1px solid var(--color--card-glass-border);
  }
  &__toggle-row strong,
  &__toggle-row small {
    display: block;
  }
  &__toggle-row strong {
    font-weight: 600;
  }
  &__toggle-row small {
    margin-top: 5px;
    color: var(--asm-muted);
    font-size: 0.79rem;
    line-height: 1.35;
  }
  &__switch {
    position: relative;
    flex: 0 0 56px;
    width: 56px;
    height: 32px;
    border: 0;
    border-radius: 20px;
    background: var(--color--primary-a1);
    cursor: pointer;
  }
  &__switch[aria-checked='true'] {
    background: var(--color--low-button);
  }
  &__switch span {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--asm-text);
    transition: transform 0.18s ease;
  }
  &__switch[aria-checked='true'] span {
    transform: translateX(24px);
  }
  &__switch:focus-visible,
  &__action:focus-visible {
    outline: 2px solid var(--color--primary-a3);
    outline-offset: 2px;
  }
  &__action--delete-database {
    justify-content: flex-start;
    width: 100%;
    margin-top: auto;
    text-align: left;
  }
  &__action--delete-database span,
  &__action--delete-database small {
    display: block;
  }
  &__action--delete-database small {
    margin-top: 3px;
    opacity: 0.8;
    font-size: 0.78rem;
  }
  &__card--terms {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  &__card--terms .settings__actions {
    margin-top: 0;
  }
}
@media (max-width: 1100px) {
  .settings__row--three {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .settings__row--three .settings__card:last-child {
    grid-column: 1 / -1;
  }
}
@media (max-width: 750px) {
  .settings__row--three,
  .settings__row--two {
    grid-template-columns: minmax(0, 1fr);
  }
  .settings__row--three .settings__card:last-child {
    grid-column: auto;
  }
  .settings__card--terms {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
