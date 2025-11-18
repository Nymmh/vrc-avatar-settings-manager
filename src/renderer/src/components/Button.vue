<script lang="ts" setup>
defineProps({
  label: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="button__wrapper">
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
