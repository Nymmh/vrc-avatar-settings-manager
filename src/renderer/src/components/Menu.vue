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
    <Button
      v-show="currentView !== 'AllPresets'"
      label="Presets"
      :small="true"
      :alt-color="true"
      @click="$emit('changeView', 'AllPresets')"
    />
  </div>
</template>

<style lang="scss" scoped>
.menu {
  align-items: flex-end;
  display: flex;
  flex-flow: column;
  gap: 8px;
  position: absolute;
  right: 1rem;
  top: 1rem;
  z-index: 100;
}
</style>
