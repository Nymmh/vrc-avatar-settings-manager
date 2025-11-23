<script lang="ts" setup>
defineProps({
  small: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  altColor: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div
    :class="[
      'button__wrapper',
      {
        'button__wrapper--small': small,
        'button__wrapper--alt-color': altColor,
        'button__wrapper--error': error
      }
    ]"
  >
    <button class="button">
      {{ label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.button {
  padding: 5px 12px;

  &__wrapper {
    border: 1px solid transparent;
    background-color: var(--color--primary-a4);
    border-radius: 8px;
    cursor: pointer;
    display: inline-block;
    font-size: 1em;
    font-family: inherit;
    padding: 6px 12px;
    transition: border-color 0.25s;
    width: fit-content;

    &--small {
      padding: 3px 8px;

      .button {
        padding: 3px 8px;
        font-size: 0.875em;
      }
    }

    &--error {
      background-color: var(--color--failed);
      color: var(--color--error-a1);
    }

    &--alt-color {
      background-color: var(--color--secondary-a1);
      color: var(--color--primary-a1);
    }

    &:hover {
      border-color: var(--color--primary-a3);
    }

    &:focus,
    &:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }
  }
}
</style>
