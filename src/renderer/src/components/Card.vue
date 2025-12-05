<script lang="ts" setup>
defineProps<{
  title?: string
  subtitle?: string
  padding?: 'none' | 'small' | 'medium' | 'large'
  elevation?: 'none' | 'low' | 'medium' | 'high'
  hoverable?: boolean
  clickable?: boolean
  variant?: 'default' | 'outlined' | 'filled'
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <div class="card">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.card {
  align-items: center;
  background-color: var(--color--card-glass-bg);
  border: 1px solid var(--color--card-glass-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  padding: 22px;
  position: relative;
  transition: box-shadow 0.35s ease-in-out;
  width: fit-content;

  &::before {
    backdrop-filter: blur(4px);
    border-radius: inherit;
    content: '';
    inset: 0;
    position: absolute;
    z-index: -1;
  }

  &:hover {
    box-shadow:
      0 3px 5px rgba(7, 42, 66, 0.5),
      0 3px 4px rgba(7, 42, 66, 0.7);
  }
}

.card:has(.input-text:focus) {
  box-shadow:
    0 3px 5px rgba(7, 42, 66, 0.5),
    0 3px 4px rgba(7, 42, 66, 0.7);
}
</style>
