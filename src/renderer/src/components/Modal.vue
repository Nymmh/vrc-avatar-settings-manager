<script lang="ts" setup>
defineEmits(['closeModal'])
</script>

<template>
  <div class="modal">
    <div class="modal__close">
      <span class="modal__close--button" @click="$emit('closeModal')">X</span>
    </div>
    <div class="modal__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal {
  background-color: var(--color--primary-a1);
  border-radius: 8px;
  padding: 12px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  z-index: 1000;

  &__close {
    align-self: flex-end;
    display: flex;
    text-align: right;
    justify-content: flex-end;

    &--button {
      cursor: pointer;
      transition: color ease-in-out 0.22s;

      &:hover {
        color: var(--color--primary-a4);
      }
    }
  }

  &__content {
    display: flex;
    justify-content: center;
    padding: 8px;
    padding-top: 26px;
    width: 100%;

    &:deep(div:not([class])) {
      width: 100%;
    }
  }
}
</style>
