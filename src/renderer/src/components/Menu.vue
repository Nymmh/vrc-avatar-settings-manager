<script lang="ts" setup>
import { handleChangeView } from '@renderer/composables/changeView'
import Button from './Button.vue'
import { appStorage } from '../composables/appStorage'

const appStore = appStorage()
</script>

<template>
  <div class="menu">
    <nav class="menu__nav">
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
    flex-flow: row wrap;
    gap: 16px;
    justify-content: center;
    margin: 0;
    width: 100%;
  }

  &:hover {
    box-shadow:
      0 3px 5px rgba(7, 42, 66, 0.5),
      0 3px 4px rgba(7, 42, 66, 0.7);
  }
}
</style>
