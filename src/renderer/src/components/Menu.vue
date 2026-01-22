<script lang="ts" setup>
import { handleChangeView } from '@renderer/composables/changeView'
import Button from './Button.vue'
import { appStorage } from '../composables/appStorage'

const appStore = appStorage()

const randomParams = async (): Promise<void> => {
  const res = await window.avatarApi.randomParams()

  emit('notification', {
    type: res ? 'success' : 'error',
    title: 'Random Changes',
    text: res ? 'Random applied successfully.' : 'Failed to apply random.'
  })
}

const emit = defineEmits(['notification'])
</script>

<template>
  <div class="menu">
    <nav class="menu__nav">
      <div class="menu__center">
        <Button
          v-show="appStore.currentView !== 'Main' && appStore.currentView !== 'Waiting'"
          label="Home"
          :small="true"
          @click="handleChangeView('Main')"
        />
        <Button
          v-show="appStore.currentView !== 'AllData'"
          label="All Data"
          :small="true"
          @click="handleChangeView('AllData')"
        />
      </div>
      <div class="menu__right">
        <Button
          v-show="appStore.currentView !== 'Waiting' && appStore.avatarId"
          label="Random"
          :small="true"
          @click="randomParams"
        />
      </div>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
.menu {
  backdrop-filter: blur(16px);
  background-color: var(--color--card-glass-bg);
  border: 1px solid var(--color--card-glass-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0);
  padding: 1rem;
  position: sticky;
  top: 0;
  transition: box-shadow 0.25s ease-in-out;
  width: 100%;
  z-index: 100;

  &__nav {
    align-items: center;
    display: flex;
    justify-content: center;
    position: relative;
    width: 100%;
  }

  &__center {
    align-items: center;
    display: flex;
    flex-flow: row wrap;
    gap: 16px;
    justify-content: center;
    margin: 0;
  }

  &__right {
    align-items: center;
    display: flex;
    flex-flow: row wrap;
    gap: 16px;
    margin: 0;
    margin-left: auto;
    position: absolute;
    right: 0;
  }

  &:hover {
    box-shadow:
      0 3px 5px rgba(7, 42, 66, 0.5),
      0 3px 4px rgba(7, 42, 66, 0.7);
  }
}
</style>
