<script lang="ts" setup>
defineProps({
  placeholder: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  minSize: {
    type: Number,
    default: 0
  },
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="input-text__wrapper">
    <div class="input-text__group">
      <label v-if="label" :for="id" class="input-text__label">{{ label }}</label>
      <input
        :id="id"
        :class="['input-text', { 'input-text--failed': error }]"
        :placeholder="placeholder"
        :minlength="minSize"
        :value="modelValue"
        @input="
          $emit('update:modelValue', {
            id: id,
            value: ($event.currentTarget as HTMLInputElement)?.value
          })
        "
      />
    </div>
    <p v-if="error" class="input-text__error failed">{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '../styles/scss/color.scss' as colors;

.input-text {
  background-color: transparent;
  border: none;
  border-bottom: 2px solid var(--color--primary-a4);
  border-radius: 0;
  display: inline;
  font-weight: 700;
  padding: 6px 12px;
  transition: all 1s ease-in-out;
  width: 100%;

  &--error {
    border-bottom-color: var(--color--failed);
  }

  &:hover,
  &:focus,
  &:focus-visible {
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(135deg, #5a7b99 0%, #4a7fb8 100%) 1;
    border-image-slice: 1;
  }

  &__label {
    font-weight: 500;
  }

  &__wrapper {
    display: flex;
    flex-flow: column;
    gap: 8px;
    justify-content: center;
    width: 100%;
  }

  &__group {
    align-items: center;
    display: flex;
    flex-flow: row nowrap;
    gap: 4px;
    width: 100%;
  }

  &__error {
    flex-basis: 100%;
    text-align: center;
  }
}
</style>
