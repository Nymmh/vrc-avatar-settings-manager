<script lang="ts" setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="input-checkbox__wrapper">
    <div class="input-checkbox__group">
      <input
        :id="id"
        class="input-checkbox__input"
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.currentTarget as HTMLInputElement)"
      />
      <label v-if="label" :for="id" class="input-checkbox__label">
        <span class="input-checkbox__label-text">{{ label }}</span>
        <span class="input-checkbox__checkmark" />
      </label>
    </div>
    <p v-if="error" class="input-checkbox__error failed">{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.input-checkbox {
  &__wrapper {
    display: flex;
    flex-flow: column;
    gap: 8px;
    justify-content: center;
    width: fit-content;
  }

  &__group {
    display: inline-block;
    width: 100%;
  }

  &__input {
    height: 0;
    opacity: 0;
    position: absolute;
    width: 0;
  }

  &__label {
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: 8px;
    user-select: none;
  }

  &__label-text {
    margin-top: 2px;
  }

  &__checkmark {
    background-color: var(--color--primary-a2);
    border: 1px solid transparent;
    border-radius: 4px;
    display: block;
    height: 20px;
    position: relative;
    transition: all 0.25s;
    width: 20px;

    &::after {
      border: solid var(--color--primary-a2);
      border-width: 0 2px 2px 0;
      content: '';
      display: none;
      height: 10px;
      left: 7px;
      position: absolute;
      top: 3px;
      transform: rotate(45deg);
      width: 5px;
    }
  }
}

.input-checkbox__input:checked ~ .input-checkbox__label .input-checkbox__checkmark {
  background-color: var(--color--primary-a4);
  border-color: var(--color--primary-a4);

  &::after {
    display: block;
  }
}

.input-checkbox__input:checked ~ .input-checkbox__label:hover .input-checkbox__checkmark {
  border-color: var(--color--primary-a3);
}
</style>
