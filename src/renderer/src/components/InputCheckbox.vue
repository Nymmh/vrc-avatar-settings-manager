<script lang="ts" setup>
import { computed } from 'vue'
import { appStorage } from '../composables/appStorage'

const appStore = appStorage()
const lowPerformanceMode = computed(() => appStore.value.lowPerformanceMode)

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
  <div
    :class="[
      'input-checkbox__wrapper',
      { 'input-checkbox__wrapper--low-performance': lowPerformanceMode }
    ]"
  >
    <div class="input-checkbox__group">
      <input
        :id="id"
        class="input-checkbox__input"
        type="checkbox"
        :checked="modelValue"
        @change="
          $emit('update:modelValue', { id, checked: ($event.target as HTMLInputElement).checked })
        "
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
@use 'sass:color';
@use '../styles/scss/color.scss' as colors;

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
    transition: all 0.5s ease-in-out;
    width: 0;
  }

  &__label {
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: 8px;
    transition: all 0.25s;
    user-select: none;
  }

  &__label-text {
    margin-top: 2px;
  }

  &__checkmark {
    background-color: var(--color--primary-a6);
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

  &__wrapper--low-performance {
    .input-checkbox__input,
    .input-checkbox__label,
    .input-checkbox__checkmark {
      transition: none !important;
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

.input-checkbox__input:not(:checked) ~ .input-checkbox__label:hover .input-checkbox__checkmark {
  background-color: #{color.adjust(colors.$color--primary-a6, $lightness: -20%)};
}

.input-checkbox__input:checked ~ .input-checkbox__label:hover .input-checkbox__checkmark {
  background-color: #{color.adjust(colors.$color--primary-a4, $lightness: -20%)};
}

.input-checkbox__input ~ .input-checkbox__label:hover .input-checkbox__checkmark {
  border-color: var(--color--primary-a3);
}

.input-checkbox__wrapper--low-performance
  .input-checkbox__input:not(:checked)
  ~ .input-checkbox__label:hover
  .input-checkbox__checkmark {
  background-color: var(--color--primary-a6) !important;
}

.input-checkbox__wrapper--low-performance
  .input-checkbox__input:checked
  ~ .input-checkbox__label:hover
  .input-checkbox__checkmark {
  background-color: var(--color--primary-a4) !important;
}
</style>
