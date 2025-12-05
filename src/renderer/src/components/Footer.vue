<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import Button from './Button.vue'
import { appStorage } from '../composables/appStorage'

const appStore = appStorage()

const version = ref<string>('')

const getVersion = async (): Promise<void> => {
  version.value = await window.appApi.appVersion()
}

const handleExport = async (): Promise<void> => {
  const res = await window.avatarApi.exportAllConfigs()

  let type = 'success'
  let title = 'Export Successful'

  if (!res.success) {
    type = 'error'
    title = 'Export Failed'
  }

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
  getVersion()
})

const emit = defineEmits(['notification'])
</script>
<template>
  <div class="footer">
    <p class="footer__version">Version: {{ version }}</p>
    <div class="footer__center">
      <a href="https://jinxxy.com/Nymh" target="_blank" rel="noopener noreferrer">Nymh</a>
      <a href="https://discord.gg/rcCCkbDsY3" target="_blank" rel="noopener noreferrer">Discord</a>
      <Button label="Export All" :small="true" @click="handleExport" />
      <Button label="Import All" :small="true" @click="handleImport" />
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

  &__version {
    margin: 0;
    opacity: 0.6;
  }

  &__center {
    display: flex;
    flex-flow: row nowrap;
    gap: 16px;
    align-items: center;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
