<script lang="ts" setup>
import { computed } from 'vue'
import { appStorage } from '../composables/appStorage'

const appStore = appStorage()
const lowPerformanceMode = computed(() => appStore.value.lowPerformanceMode)

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
  warning: {
    type: Boolean,
    default: false
  },
  hero: {
    type: Boolean,
    default: false
  },
  tooltip: {
    type: String,
    default: ''
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
        'button__wrapper--warning': warning,
        'button__wrapper--hero': hero,
        'button__wrapper--low-performance': lowPerformanceMode
      }
    ]"
  >
    <button class="button">
      {{ label }}
    </button>
    <span v-if="tooltip" class="button__tooltip">{{ tooltip }}</span>
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

    &--warning {
      background: var(--color--gradient-warning);
      color: var(--color--primary-a2);

      &:hover {
        background:
          linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
          var(--color--gradient-warning) !important;
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

    &--low-performance {
      transition: none;
      background: var(--color--low-button);

      &:hover {
        background: var(--color--low-button-hover) !important;
      }

      &.button__wrapper--error {
        background: var(--color--low-error) !important;

        &:hover {
          background: var(--color--low-error-hover) !important;
        }
      }

      &.button__wrapper--warning {
        background: var(--color--low-warning) !important;

        &:hover {
          background: var(--color--low-warning-hover) !important;
        }
      }

      &.button__wrapper--hero {
        background: var(--color--low-hero) !important;

        &:hover {
          background: var(--color--low-hero-hover) !important;
        }
      }

      &.button__wrapper--alt-color {
        background-color: var(--color--secondary-a1) !important;

        &:hover {
          background-color: var(--color--secondary-a1) !important;
        }
      }

      .button__tooltip {
        backdrop-filter: none;
        background-color: var(--color--low-card-glass-bg) !important;
        border: 1px solid var(--color--low-card-glass-border);
        transition: none;
      }

      &:hover .button__tooltip {
        transition-delay: 0s;
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

    position: relative;

    &:hover .button__tooltip {
      opacity: 1;
      transition-delay: 0.55s;
    }
  }

  &__tooltip {
    backdrop-filter: blur(2px);
    background-color: #{color.adjust(colors.$color--card-glass-bg, $alpha: 0.5, $lightness: -5%)};
    border: 1px solid var(--color--card-glass-border);
    border-radius: 8px;
    bottom: 100%;
    color: var(--color--primary-a2);
    font-size: 0.8em;
    left: 50%;
    margin-bottom: 8px;
    opacity: 0;
    padding: 6px 12px;
    pointer-events: none;
    position: absolute;
    transform: translateX(-50%);
    transition: opacity 0.35s ease-in-out;
    white-space: nowrap;
    z-index: 1000;

    &::after {
      border: 5px solid transparent;
      border-top: 5px solid rgba(0, 0, 0, 0.7);
      content: '';
      left: 50%;
      position: absolute;
      top: 100%;
      transform: translateX(-50%);
    }
  }
}
</style>
