<script setup lang="ts">
import { onMounted, onUnmounted, ref, toValue } from 'vue'
import { InputSelectInterface } from '../types/InputSelectInterface'

const props = defineProps({
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
  error: {
    type: String,
    default: ''
  },
  options: {
    type: Array<InputSelectInterface>,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])
const isOpen = ref<boolean>(false)
const selectRef = ref<HTMLElement | null>(null)

const toggleDropdown = (): boolean => (isOpen.value = !isOpen.value)

const selectOption = (value: string | number): void => {
  emit('update:modelValue', { id: props.id, value: String(value) })
  isOpen.value = false
}

const getLabel = (value: string, options: InputSelectInterface[]): string => {
  const selected = options.find((o) => String(o.value) === value)
  return selected?.label || 'No Selection'
}

const clickOutside = (event: MouseEvent): void => {
  if (toValue(selectRef) && !toValue(selectRef)?.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', clickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', clickOutside)
})
</script>

<template>
  <div class="input-select">
    <label v-if="label" :for="id" class="input-select__label">
      {{ label }}
    </label>
    <div ref="selectRef" class="input-select__wrapper">
      <button
        :id="id"
        type="button"
        class="input-select__trigger"
        :class="{ 'input-select__trigger--open': isOpen }"
        @click="toggleDropdown"
      >
        <span class="input-select__value">
          {{ getLabel(modelValue, options) }}
        </span>
        <span class="input-select__arrow" :class="{ 'input-select__arrow--open': isOpen }">
          ▼
        </span>
      </button>
      <transition name="dropdown">
        <ul v-if="isOpen" class="input-select__dropdown">
          <li
            v-for="option in options"
            :key="option.value"
            :class="[
              'input-select__option',
              { 'input-select__option--selected': String(option.value) === modelValue }
            ]"
            @click="selectOption(option.value)"
          >
            {{ option.label }}
          </li>
        </ul>
      </transition>
    </div>
    <p v-if="error" class="input-select__error failed">{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '../styles/scss/color.scss' as colors;

.input-select {
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: 4px;
  justify-content: center;
  width: fit-content;

  &__label {
    color: var(--color--primary-a2);
    cursor: pointer;
  }

  &__wrapper {
    position: relative;
    max-width: 300px;
    min-width: 200px;
    width: fit-content;
  }

  &__trigger {
    align-items: center;
    background: var(--color--gradient-select);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    gap: 8px;
    justify-content: space-between;
    padding: 8px 12px;
    transition: all 0.5s ease-in-out;
    width: 100%;

    &:hover {
      background:
        linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
        var(--color--gradient-select);
      border-color: var(--color--primary-a3);
    }

    &--open {
      border-color: var(--color--primary-a3);
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  &__value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__arrow {
    flex-shrink: 0;
    transition: transform 0.4s ease;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__dropdown {
    background-color: var(--color--primary-a6);
    border: 1px solid var(--color--primary-a3);
    border-top: none;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    list-style: none;
    margin: 0;
    max-height: 200px;
    max-width: 300px;
    min-width: 200px;
    overflow-y: auto;
    padding: 0;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    z-index: 10000;
  }

  &__option {
    cursor: pointer;
    overflow: hidden;
    padding: 10px 12px;
    text-overflow: ellipsis;
    transition: background-color 0.25s;
    white-space: nowrap;

    &:hover {
      background-color: var(--color--primary-a1);
    }

    &--selected {
      background-color: var(--color--primary-a5);
    }
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.25s ease;
  transform-origin: top;
}

.dropdown-enter-from {
  opacity: 0;
  transform: scaleY(0);
}

.dropdown-enter-to {
  opacity: 1;
  transform: scaleY(1);
}

.dropdown-leave-from {
  opacity: 1;
  transform: scaleY(1);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0);
}
</style>
