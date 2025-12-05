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
  },
  hero: {
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
        'button__wrapper--error': error,
        'button__wrapper--hero': hero
      }
    ]"
  >
    <button class="button">
      {{ label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '../styles/scss/color.scss' as colors;

.button {
  padding: 5px 12px;

  &__wrapper {
    border: 1px solid transparent;
    background: var(--color--gradient-button);
    border-radius: 8px;
    cursor: pointer;
    display: inline-block;
    font-size: 1em;
    font-family: inherit;
    padding: 6px 12px;
    transition:
      border-color 0.5s ease-in-out,
      background 0.5s ease-in-out;
    width: fit-content;

    &--small {
      padding: 3px 8px;

      .button {
        padding: 3px 8px;
        font-size: 0.875em;
      }
    }

    &--error {
      background: var(--color--gradient-error);
      color: var(--color--primary-a2);

      &:hover {
        background:
          linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
          var(--color--gradient-error) !important;
      }
    }

    &--hero {
      background: var(--color--gradient-hero);
      color: var(--color--primary-a2);

      &:hover {
        background:
          linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
          var(--color--gradient-hero) !important;
      }
    }

    &--alt-color {
      background-color: var(--color--secondary-a1);

      &:hover {
        background-color: #{color.adjust(colors.$color--secondary-a1, $lightness: -20%)};
      }
    }

    &:hover {
      background:
        linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
        var(--color--gradient-button);
      border-color: var(--color--primary-a3);
    }

    &:focus,
    &:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }
  }
}
</style>
