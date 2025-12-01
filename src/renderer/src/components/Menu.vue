<script lang="ts" setup>
import { handleChangeView } from '@renderer/composables/changeView'
import Button from './Button.vue'
import { appStorage } from '../composables/appStorage'

const appStore = appStorage()
</script>

<template>
  <div class="menu underline">
    <nav class="menu__nav">
      <Button
        v-show="appStore.currentView !== 'Main' && appStore.currentView !== 'Waiting'"
        label="Home"
        :small="true"
        :alt-color="true"
        @click="handleChangeView('Main')"
      />
      <Button
        v-show="appStore.currentView !== 'AllData'"
        label="All Data"
        :small="true"
        :alt-color="true"
        @click="handleChangeView('AllData')"
      />
    </nav>
  </div>
</template>

<style lang="scss" scoped>
.menu {
  background: var(--color--primary-a1);
  padding: 1rem;
  position: sticky;
  top: 0;
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
}
</style>
