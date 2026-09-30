<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRaw } from 'vue'
import { useNotification } from '@kyvg/vue3-notification'
import AllData from './views/AllData.vue'
import Settings from './views/Settings.vue'
import Privacy from './views/Privacy.vue'
import Terms from './views/Terms.vue'
import Waiting from './components/Waiting.vue'
import LoadFile from './components/LoadFile.vue'
import Icon from './components/Icon.vue'
import { appStorage } from './composables/appStorage'
import { handleChangeView } from './composables/changeView'
import type { avatarConfigType } from '../../types/avatarConfigType'
import type { NotificationInterface } from './types/notificationInterface'
import 'overlayscrollbars/overlayscrollbars.css'
import './styles/global.scss'

type SavedConfig = NonNullable<Awaited<ReturnType<typeof window.avatarApi.getAllSaved>>>[number]

const appStore = appStorage()
const { notify } = useNotification()
const avatarConfig = ref<avatarConfigType | null>(null)
const avatarName = computed(() => avatarConfig.value?.name || 'Current Avatar')
const saveName = ref('')
const holdSaveName = ref(false)
const nsfw = ref(false)
const savedConfigs = ref<SavedConfig[]>([])
const selectedPresetId = ref('')
const vrchatRunning = ref(false)
const oscStats = ref({ received: 0, sent: 0 })
const version = ref('')
let statusTimer: number | undefined
let statsTimer: number | undefined
const cleanup: Array<() => void> = []

const currentConfigs = computed(() =>
  savedConfigs.value.filter((config) => config.avatarId === appStore.value.avatarId)
)
const selectedPreset = computed(() =>
  currentConfigs.value.find((config) => String(config.id) === selectedPresetId.value)
)

function message(data: NotificationInterface): void {
  notify({ type: data.type, title: data.title, text: data.text || '' })
}

async function refreshSaved(): Promise<void> {
  savedConfigs.value = (await window.avatarApi.getAllSaved()) || []
  if (!currentConfigs.value.some((config) => String(config.id) === selectedPresetId.value)) {
    selectedPresetId.value = ''
  }
  appStore.value.dataTableRefresh = true
}

async function refreshAvatar(): Promise<void> {
  const result = await window.avatarApi.refreshAvatarFile()
  if (!result.success) message({ type: 'error', title: 'Avatar refresh failed' })
}

async function saveCurrent(): Promise<void> {
  const name = saveName.value.trim()
  if (!name || !avatarConfig.value || !appStore.value.avatarFoundFile) {
    message({ type: 'error', title: 'Save failed', text: 'Enter a name and load an avatar first.' })
    return
  }

  holdSaveName.value = true
  const result = await window.avatarApi.saveConfig(toRaw(avatarConfig.value), nsfw.value, name)
  if (!result?.success) {
    message({ type: 'error', title: 'Save failed', text: result?.message || '' })
    return
  }

  await refreshSaved()
  message({ type: 'success', title: 'Preset saved' })
}

async function loadPreset(): Promise<void> {
  const preset = selectedPreset.value
  if (!preset?.id) return
  const result = await window.avatarApi.applyConfig(preset.id)
  message({
    type: result.success ? 'success' : 'error',
    title: result.success ? 'Preset loaded' : 'Preset load failed'
  })
}

async function updatePreset(): Promise<void> {
  const preset = selectedPreset.value
  if (!preset?.id) {
    message({ type: 'error', title: 'Update failed', text: 'Preset configuration was not found.' })
    return
  }
  const result = await window.avatarApi.updateConfig(
    preset.id,
    preset.avatarId || 'Unknown',
    preset.avatarName || 'Unknown',
    preset.name || ''
  )
  message({
    type: result.success ? 'success' : 'error',
    title: result.success ? 'Preset updated' : 'Update failed',
    text: result.message
  })
  if (result.success) await refreshSaved()
}

async function deletePreset(): Promise<void> {
  const preset = selectedPreset.value
  if (!preset?.id) return
  const result = await window.avatarApi.deleteConfig(preset.id)
  message({
    type: result.success ? 'success' : 'error',
    title: result.success ? 'Preset deleted' : 'Delete failed',
    text: result.message
  })
  if (result.success) await refreshSaved()
}

async function copySelected(): Promise<void> {
  const config = selectedPreset.value
  if (!config?.id) {
    message({ type: 'error', title: 'Select a preset to copy' })
    return
  }
  const result = await window.avatarApi.copyConfigCode(config.id)
  message({
    type: result.success ? 'success' : 'error',
    title: result.success ? 'Copied to clipboard' : 'Copy failed',
    text: result.message
  })
}

async function applyCopied(): Promise<void> {
  const result = await window.avatarApi.applyCopiedCode()
  message({
    type: result.success ? 'success' : 'error',
    title: result.success ? 'Code applied' : 'Apply failed',
    text: result.message
  })
  await refreshSaved()
}

async function randomize(): Promise<void> {
  const result = await window.avatarApi.randomParams()
  message({
    type: result.success ? 'success' : result.cancelled ? 'info' : 'error',
    title: result.success
      ? 'Random values applied'
      : result.cancelled
        ? 'Randomization cancelled'
        : 'Randomization failed'
  })
}

async function copyAvatarId(): Promise<void> {
  const result = await window.avatarApi.copyAvatarId()
  message({
    type: result.success ? 'success' : 'error',
    title: result.success ? 'Avatar ID copied' : 'Copy failed'
  })
}

async function refreshStatus(): Promise<void> {
  try {
    vrchatRunning.value = await window.appApi.isVRChatRunning()
  } catch {
    vrchatRunning.value = false
  }
}

async function refreshStats(): Promise<void> {
  try {
    oscStats.value = await window.appApi.getOscStats()
  } catch {
    // Keep the most recent counts while the main process is starting.
  }
}

onMounted(() => {
  void window.appApi.getLowPerformanceModeSetting().then((value) => {
    appStore.value.lowPerformanceMode = value
  })
  void window.appApi.appVersion().then((value) => {
    version.value = value
  })
  void refreshStatus()
  void refreshStats()
  void refreshSaved()
  statusTimer = window.setInterval(() => {
    void refreshStatus()
  }, 5000)
  statsTimer = window.setInterval(() => {
    void refreshStats()
  }, 1000)

  cleanup.push(
    window.avatarApi.avatarId(({ id }) => {
      appStore.value.avatarId = id
      appStore.value.avatarFoundFile = false
      avatarConfig.value = null
      selectedPresetId.value = ''
      saveName.value = ''
      holdSaveName.value = false
      if (id && appStore.value.currentView === 'Waiting') appStore.value.currentView = 'Main'
      void refreshSaved()
    })
  )
  cleanup.push(
    window.avatarApi.foundAvatarFile(({ success }) => {
      appStore.value.avatarFoundFile = success
    })
  )
  cleanup.push(
    window.avatarApi.avatarConfig((data) => {
      avatarConfig.value = { ...data, valuedParams: undefined }
      if (!holdSaveName.value) saveName.value = data.name || ''
    })
  )
  cleanup.push(
    window.avatarApi.savedNames(() => {
      void refreshSaved()
    })
  )
  cleanup.push(
    window.avatarApi.dataTableRefresh(() => {
      void refreshSaved()
    })
  )
  cleanup.push(
    window.appApi.onVRChatStatusChanged(({ isRunning }) => {
      vrchatRunning.value = isRunning
      if (!isRunning) {
        appStore.value.avatarId = ''
        appStore.value.avatarFoundFile = false
        avatarConfig.value = null
        holdSaveName.value = false
        selectedPresetId.value = ''
        appStore.value.currentView = 'Waiting'
      }
    })
  )
})

onUnmounted(() => {
  if (statusTimer !== undefined) window.clearInterval(statusTimer)
  if (statsTimer !== undefined) window.clearInterval(statsTimer)
  cleanup.forEach((dispose) => dispose())
})
</script>

<template>
  <notifications class="notification" position="bottom left" />
  <div class="shell" :class="{ 'shell--low-performance': appStore.lowPerformanceMode }">
    <aside class="sidebar">
      <nav class="sidebar__nav" aria-label="Main navigation">
        <button
          class="sidebar__link"
          :class="{
            'is-active': appStore.currentView === 'Main' || appStore.currentView === 'Waiting'
          }"
          @click="handleChangeView('Main')"
        >
          <Icon name="user" :size="22" />
          Current Avatar
        </button>
        <button
          class="sidebar__link"
          :class="{ 'is-active': appStore.currentView === 'AllData' }"
          @click="handleChangeView('AllData')"
        >
          <Icon name="database" :size="22" />
          All Data
        </button>
      </nav>
      <div class="sidebar__bottom">
        <button
          class="sidebar__link"
          :class="{ 'is-active': ['Settings', 'Privacy', 'Terms'].includes(appStore.currentView) }"
          @click="handleChangeView('Settings')"
        >
          <Icon name="gear" :size="22" />
          Settings
        </button>
        <button class="sidebar__link" :disabled="!appStore.avatarFoundFile" @click="randomize">
          <Icon name="shuffle" :size="22" />
          Randomize
        </button>
        <div class="sidebar__social">
          <a href="https://jinxxy.com/Nymh" target="_blank" rel="noopener noreferrer">Nymh</a>
          <a href="https://discord.gg/rcCCkbDsY3" target="_blank" rel="noopener noreferrer"
            >Discord</a
          >
        </div>
        <small v-if="version" class="sidebar__version">v{{ version }}</small>
      </div>
    </aside>

    <div class="workspace">
      <header class="status-bar">
        <span class="status-bar__connection" :class="{ 'is-connected': vrchatRunning }">
          <span class="status-bar__dot" />VRChat {{ vrchatRunning ? 'connected' : 'disconnected' }}
        </span>
        <div class="status-bar__counts" aria-label="OSC message counts">
          <span
            >OSC received <strong>{{ oscStats.received.toLocaleString() }}</strong></span
          >
          <span
            >OSC sent <strong>{{ oscStats.sent.toLocaleString() }}</strong></span
          >
        </div>
      </header>

      <main class="workspace__content">
        <AllData v-if="appStore.currentView === 'AllData'" @notification="message" />
        <Settings v-else-if="appStore.currentView === 'Settings'" @notification="message" />
        <Privacy v-else-if="appStore.currentView === 'Privacy'" />
        <Terms v-else-if="appStore.currentView === 'Terms'" />
        <section v-else class="avatar-panel">
          <Waiting v-if="!appStore.avatarId" />
          <template v-else>
            <div class="avatar-panel__identity">
              <p class="eyebrow">Current Avatar</p>
              <h1>{{ avatarName }}</h1>
              <button class="avatar-panel__id" title="Copy Avatar ID" @click="copyAvatarId">
                {{ appStore.avatarId }} <span>⧉</span>
              </button>
              <p v-if="!appStore.avatarFoundFile" class="avatar-panel__missing">
                Could not find avatar data. Try changing avatars and back, or refresh after VRChat
                regenerates its files.
              </p>
              <button
                v-if="!appStore.avatarFoundFile"
                class="action action--secondary"
                @click="refreshAvatar"
              >
                Refresh avatar data
              </button>
            </div>

            <div v-if="appStore.avatarFoundFile" class="avatar-panel__body">
              <div class="preset-form">
                <div class="field">
                  <label for="current-preset">Saved presets for this avatar</label>
                  <select id="current-preset" v-model="selectedPresetId">
                    <option value="">Select a preset</option>
                    <option
                      v-for="config in currentConfigs"
                      :key="config.id"
                      :value="String(config.id)"
                    >
                      {{ config.name }}
                    </option>
                  </select>
                </div>
                <label class="check"><input v-model="nsfw" type="checkbox" /> NSFW</label>
              </div>
              <div class="save-form">
                <div class="field">
                  <label for="preset-name">Preset name</label>
                  <input
                    id="preset-name"
                    v-model="saveName"
                    type="text"
                    placeholder="Name this setup"
                  />
                </div>
                <button class="action action--save" @click="saveCurrent">
                  <Icon name="save" :size="19" />Save Preset
                </button>
              </div>
              <div class="selected-preset-actions">
                <button
                  class="action action--update"
                  :disabled="!selectedPresetId"
                  @click="updatePreset"
                >
                  <Icon name="refresh" :size="19" />
                  Update
                </button>
                <button
                  class="action action--apply"
                  :disabled="!selectedPresetId"
                  @click="loadPreset"
                >
                  <Icon name="download" :size="19" />
                  Load
                </button>
                <button
                  class="action action--delete"
                  :disabled="!selectedPresetId"
                  @click="deletePreset"
                >
                  <Icon name="trash" :size="19" />
                  Delete
                </button>
              </div>

              <div class="avatar-panel__spacer" />

              <div class="avatar-panel__bottom">
                <div class="avatar-panel__bottom-right">
                  <button class="action" :disabled="!selectedPresetId" @click="copySelected">
                    <Icon name="copy" :size="19" />
                    Copy To Clipboard
                  </button>
                  <button class="action" @click="applyCopied">
                    <Icon name="file" :size="19" />
                    Apply Copied Code
                  </button>
                  <LoadFile
                    :avatar-name="avatarConfig?.name"
                    :show-id-mismatch="false"
                    @notification="message"
                    @uploaded="refreshSaved"
                  />
                </div>
              </div>
            </div>
          </template>
        </section>
      </main>
    </div>
  </div>
</template>

<style lang="scss">
:root {
  color-scheme: dark;
  --asm-background: #080a0c;
  --asm-sidebar: var(--color--low-card-glass-bg);
  --asm-panel: var(--color--low-card-glass-bg);
  --asm-control: var(--color--primary-a6);
  --asm-control-hover: var(--color--low-select-hover);
  --asm-selected: var(--color--primary-a4);
  --asm-danger: var(--color--low-error);
  --asm-text: var(--color--primary-a2);
  --asm-muted: var(--color--secondary-a1);
}
html,
body,
#app {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
body {
  margin: 0;
  background: var(--asm-background);
  color: var(--asm-text);
}
body::before {
  display: none !important;
}
button,
input,
select {
  font: inherit;
}
button {
  cursor: pointer;
}
.shell {
  display: grid;
  grid-template-columns: clamp(190px, 20vw, 255px) minmax(0, 1fr);
  width: 100%;
  height: 100vh;
  min-height: 0;
  background: var(--asm-background);
}
.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 28px 20px 20px;
  background: var(--asm-sidebar);
}
.sidebar__nav {
  display: grid;
  gap: 18px;
  margin-top: 0;
}
.sidebar__bottom {
  margin-top: auto;
  display: grid;
  gap: 24px;
}
.sidebar__link {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  min-height: 55px;
  padding: 11px 15px;
  border: 0;
  border-radius: 15px;
  background: var(--color--low-button);
  color: var(--asm-text);
  text-align: center;
  font-size: 1.1rem;
  box-shadow: 0 5px 10px #0002;
}
.sidebar__link:hover {
  background: var(--color--low-button-hover);
}
.sidebar__link.is-active {
  background: var(--color--low-button-hover);
}
.sidebar__link:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}
.sidebar__link:active,
.action:active {
  filter: brightness(0.85);
}
.sidebar__social {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.sidebar__social a {
  color: var(--color--primary-a3);
  font-size: 0.9rem;
}
.sidebar__version {
  color: var(--asm-muted);
  opacity: 0.7;
}
.workspace {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 28px clamp(20px, 4vw, 46px);
  gap: 24px;
}
.status-bar {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  min-height: 58px;
  padding: 10px 20px;
  border-radius: 13px;
  background: var(--asm-panel);
}
.status-bar__connection {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--color--failed);
  font-size: clamp(1.15rem, 2vw, 1.8rem);
}
.status-bar__connection.is-connected {
  color: var(--color--success);
}
.status-bar__dot {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: currentColor;
}
.status-bar__counts {
  display: grid;
  gap: 3px;
  color: var(--asm-muted);
  font-size: 0.77rem;
  white-space: nowrap;
}
.status-bar__counts span {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}
.status-bar__counts strong {
  color: var(--asm-text);
}
.workspace__content {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
.avatar-panel {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  height: 100%;
  overflow: auto;
  border-radius: 23px;
  background: var(--asm-panel);
  padding: clamp(24px, 4vw, 48px);
}
.avatar-panel__identity {
  text-align: center;
}
.eyebrow {
  margin: 0 0 10px;
  color: var(--asm-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.17em;
}
.avatar-panel h1 {
  margin: 0;
  display: block;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  font-weight: 600;
}
.avatar-panel__id {
  border: 0;
  background: none;
  color: var(--asm-muted);
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-size: 1rem;
}
.avatar-panel__id:hover {
  color: var(--asm-text);
}
.avatar-panel__id span {
  padding-left: 6px;
}
.avatar-panel__missing {
  max-width: 480px;
  margin: 25px auto;
  color: var(--asm-muted);
}
.avatar-panel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding-top: clamp(24px, 5vh, 60px);
}
.preset-form {
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 22px;
}
.field {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.field label {
  color: var(--asm-muted);
  font-size: 0.85rem;
}
.field input,
.field select {
  width: 100%;
  min-height: 46px;
  padding: 10px 15px;
  border: 1px solid var(--color--card-glass-border);
  border-radius: 12px;
  background: var(--asm-control);
  color: var(--asm-text);
  outline: none;
}
.field input:focus,
.field select:focus {
  border-color: var(--color--primary-a3);
}
.field input::placeholder {
  color: var(--asm-muted);
}
.preset-form .field {
  width: min(100%, 450px);
}
.check {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 46px;
  white-space: nowrap;
}
.check input {
  appearance: auto;
  width: 18px;
  height: 18px;
  accent-color: var(--asm-selected);
}
.save-form {
  display: flex;
  align-items: end;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}
.save-form .field {
  width: min(100%, 440px);
}
.selected-preset-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}
.selected-preset-actions {
  margin-top: 24px;
}
.action {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 9px 18px;
  border: 0;
  border-radius: 13px;
  background: var(--color--low-button);
  color: var(--asm-text);
  box-shadow: 0 4px 7px #0002;
  white-space: nowrap;
}
.action:hover {
  background: var(--color--low-button-hover);
}
.action--danger {
  background: var(--asm-danger);
}
.action--danger:hover {
  background: var(--color--low-error-hover);
}
.action--save {
  background: var(--color--low-hero);
}
.action--save:hover {
  background: var(--color--low-hero-hover);
}
.action--update {
  background: var(--color--low-warning);
}
.action--update:hover {
  background: var(--color--low-warning-hover);
}
.action--apply {
  background: var(--color--low-button);
}
.action--apply:hover {
  background: var(--color--low-button-hover);
}
.action--delete {
  background: var(--color--low-error);
}
.action--delete:hover {
  background: var(--color--low-error-hover);
}
.action:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}
.action:disabled:active {
  filter: none;
}
.avatar-panel__spacer {
  flex: 1;
  min-height: 50px;
}
.avatar-panel__bottom {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.avatar-panel__bottom-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.avatar-panel__bottom .load-file {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.avatar-panel__bottom .load-file > .button__wrapper {
  margin: 0;
}
.avatar-panel__bottom .load-file .button__wrapper {
  background: var(--color--low-button);
  border-radius: 13px;
}
.avatar-panel__bottom .load-file .button__wrapper:hover {
  background: var(--color--low-button-hover);
}
.avatar-panel__bottom .load-file__load-options {
  flex-basis: 100%;
}
.notification {
  z-index: 5000;
}
.notification .vue-notification.success,
.notification .vue-notification.warn {
  color: #080a0c;
}
.notification .vue-notification.error,
.notification .vue-notification.info {
  color: #fff;
}
.shell--low-performance *,
.shell--low-performance *::before,
.shell--low-performance *::after {
  animation: none !important;
  transition: none !important;
  backdrop-filter: none !important;
}
.avatar-panel .waiting {
  margin: auto;
  max-width: 650px;
  text-align: center;
  color: var(--asm-muted);
}
.avatar-panel .waiting h1 {
  font-size: clamp(1.1rem, 2vw, 1.55rem);
  line-height: 1.55;
}
.shell .settings__cards-row {
  flex-wrap: wrap;
}
@media (max-width: 820px) {
  .shell {
    grid-template-columns: 150px minmax(0, 1fr);
  }
  .sidebar {
    padding: 18px 10px;
  }
  .workspace {
    padding: 16px;
    gap: 16px;
  }
  .preset-form,
  .avatar-panel__bottom {
    flex-wrap: wrap;
    justify-content: center;
  }
}
@media (max-width: 600px) {
  .shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .sidebar {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    min-height: 68px;
    padding: 10px;
  }
  .sidebar__nav {
    display: flex;
    gap: 6px;
    margin: 0;
  }
  .sidebar__bottom {
    margin: 0 0 0 auto;
    display: flex;
  }
  .sidebar__social,
  .sidebar__version {
    display: none;
  }
  .sidebar__link {
    min-height: 40px;
    padding: 7px;
    font-size: 0.75rem;
  }
  .status-bar {
    padding: 10px;
  }
  .status-bar__counts {
    font-size: 0.65rem;
  }
  .avatar-panel {
    padding: 18px;
  }
}
</style>
