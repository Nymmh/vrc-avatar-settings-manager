<script lang="ts" setup>
defineProps({
  placeholder: {
    type: String,
    default: 'Avatar Name'
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
.input-text {
  border-radius: 8px;
  border: 1px solid var(--color--primary-a4);
  display: inline;
  padding: 6px 12px;
  transition: border-color 0.25s;
  width: fit-content;

  &--error {
    border-color: var(--color--failed);
  }

  &:hover {
    border-color: var(--color--primary-a3);
  }

  &__wrapper {
    display: flex;
    flex-flow: column;
    gap: 8px;
    justify-content: center;
    width: fit-content;
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
