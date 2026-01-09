<script lang="ts" setup>
import Button from './Button.vue'

const handleApplyCode = async (): Promise<void> => {
  const res = await window.avatarApi.applyCopiedCode()

  emit('notification', {
    type: res.success ? 'success' : 'error',
    title: res.success ? 'Apply Successful' : 'Apply Failed',
    text: res.message || ''
  })
}

const emit = defineEmits(['notification'])
</script>

<template>
  <div class="paste-code">
    <Button label="Apply Copied Code" @click="handleApplyCode" />
  </div>
</template>
