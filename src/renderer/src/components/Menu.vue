<script lang="ts" setup>
import Button from './Button.vue'

defineProps({
  currentView: {
    type: String,
    default: 'Main'
  }
})

defineEmits(['changeView'])
</script>

<template>
  <div class="menu">
    <Button
      v-show="currentView !== 'Main' && currentView !== 'Waiting'"
      label="Home"
      :small="true"
      :alt-color="true"
      @click="$emit('changeView', 'Main')"
    />
    <Button
      v-show="currentView !== 'AllSaved'"
      label="All Saved"
      :small="true"
      :alt-color="true"
      @click="$emit('changeView', 'AllSaved')"
    />
  </div>
</template>

<style lang="scss" scoped>
.menu {
  align-items: center;
  display: flex;
  flex-flow: row;
  gap: 8px;
  position: absolute;
  right: 1rem;
  top: 1rem;
  z-index: 100;
}
</style>
