<script lang="ts" setup>
const props = defineProps({
  placeholder: {
    type: String,
    default: '123'
  },
  modelValue: {
    type: Number,
    default: 0
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

const increment = (currentValue: number, step: number = 1): void => {
  emit('update:modelValue', {
    id: props.id,
    value: currentValue + step
  })
}

const decrement = (currentValue: number, step: number = 1): void => {
  emit('update:modelValue', {
    id: props.id,
    value: currentValue - step
  })
}

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="input-number__wrapper">
    <div class="input-number__group">
      <label v-if="label" :for="id" class="input-number__label">{{ label }}</label>
      <div class="input-number__container">
        <input
          :id="id"
          :class="['input-number', { 'input-number--failed': error }]"
          :placeholder="placeholder"
          :minlength="minSize"
          :value="modelValue"
          type="number"
          @input="
            $emit('update:modelValue', {
              id: id,
              value: Number(($event.currentTarget as HTMLInputElement)?.value)
            })
          "
        />
        <div class="input-number__arrows">
          <button
            type="button"
            class="input-number__arrow input-number__arrow--up"
            @click="increment(modelValue)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <button
            type="button"
            class="input-number__arrow input-number__arrow--down"
            @click="decrement(modelValue)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <p v-if="error" class="input-number__error failed">{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.input-number {
  border-radius: 8px 0 0 8px;
  border: 1px solid var(--color--primary-a4);
  border-right: none;
  display: inline;
  padding: 6px 12px;
  transition: border-color 0.25s;
  width: fit-content;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

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

  &__container {
    align-items: stretch;
    display: flex;
    width: fit-content;
  }

  &__arrows {
    border: 1px solid var(--color--primary-a4);
    border-left: 0;
    border-radius: 0 8px 8px 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__arrow {
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    height: 50%;
    justify-content: center;
    padding: 0;
    transition: background-color 0.25s;
    width: 24px;

    svg {
      height: 16px;
      width: 16px;
    }

    &:hover {
      background-color: var(--color--primary-a5);
    }

    &:active {
      background-color: var(--color--primary-a6);
    }

    &--up {
      border-bottom: 1px solid var(--color--primary-a4);
    }
  }

  &__error {
    flex-basis: 100%;
    text-align: center;
  }
}
</style>
