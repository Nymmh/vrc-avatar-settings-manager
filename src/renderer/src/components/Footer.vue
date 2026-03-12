<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import Button from './Button.vue'
import { appStorage } from '../composables/appStorage'
import { handleChangeView } from '@renderer/composables/changeView'

const appStore = appStorage()

const version = ref<string>('')

const getVersion = async (): Promise<void> => {
  version.value = await window.appApi.appVersion()
}

onMounted(() => {
  getVersion()
})

defineEmits(['notification'])
</script>
<template>
  <div :class="['footer', { 'footer--low-performance': appStore.lowPerformanceMode }]">
    <p class="footer__version">Version: {{ version }}</p>
    <div class="footer__center">
      <a href="https://jinxxy.com/Nymh" target="_blank" rel="noopener noreferrer">Nymh</a>
      <a href="https://discord.gg/rcCCkbDsY3" target="_blank" rel="noopener noreferrer">Discord</a>
    </div>
    <div class="footer_right">
      <Button
        v-show="appStore.currentView !== 'Settings'"
        label="Settings"
        :small="true"
        @click="handleChangeView('Settings')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  align-items: center;
  backdrop-filter: blur(8px);
  background-color: var(--color--card-glass-bg);
  border: 1px solid var(--color--card-glass-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0);
  display: flex;
  flex-flow: row nowrap;
  gap: 16px;
  justify-content: space-between;
  padding: 1rem;
  transition: box-shadow 0.25s ease-in-out;

  &:hover {
    box-shadow:
      0 -3px 5px rgba(7, 42, 66, 0.5),
      0 -3px 4px rgba(7, 42, 66, 0.7);
  }

  &--low-performance {
    backdrop-filter: none !important;
    background-color: var(--color--low-card-glass-bg) !important;
    box-shadow: none !important;
    transition: none !important;

    &:hover {
      box-shadow: none !important;
    }
  }

  &__version {
    margin: 0;
    opacity: 0.6;
  }

  &__center {
    align-items: center;
    display: flex;
    flex-flow: row nowrap;
    gap: 16px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
