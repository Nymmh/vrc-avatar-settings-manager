<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import type { OSCStartupStatus } from '../../../types/osc'
import Button from './Button.vue'

const props = defineProps<{ status: OSCStartupStatus }>()
const showSkipCheck = ref(false)
const isSkipping = ref(false)
const skipFailed = ref(false)
let skipTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.status.state,
  (state) => {
    clearTimeout(skipTimer)
    showSkipCheck.value = false
    skipFailed.value = false
    if (state === 'waiting-vrchat') {
      skipTimer = setTimeout(() => {
        showSkipCheck.value = true
      }, 5000)
    }
  },
  { immediate: true }
)

onUnmounted(() => clearTimeout(skipTimer))

const skipVRChatCheck = async (): Promise<void> => {
  if (isSkipping.value || !showSkipCheck.value || props.status.state !== 'waiting-vrchat') return
  isSkipping.value = true
  skipFailed.value = false

  try {
    const skipped = await window.appApi.skipVRChatCheck()
    if (!skipped && props.status.state === 'waiting-vrchat') {
      skipFailed.value = true
    }
  } catch {
    skipFailed.value = true
  } finally {
    isSkipping.value = false
  }
}
</script>

<template>
  <div class="waiting">
    <h1 class="waiting__header">
      {{ status.state === 'ready' ? 'OSC connected. Waiting for avatar data...' : status.message }}
    </h1>
    <div v-if="status.state === 'waiting-vrchat' && showSkipCheck" class="waiting__skip">
      <Button
        :label="isSkipping ? 'Continuing...' : 'VRChat is already open'"
        @click="skipVRChatCheck"
      />
      <p v-if="skipFailed" role="alert">Could not skip the VRChat check. Try again.</p>
    </div>
    <p v-if="status.vrchatCheckSkipped" class="waiting__skip">VRChat check skipped.</p>
    <p v-if="status.state === 'waiting-osc' || status.state === 'failed'" class="waiting__help">
      Enable OSC in VRChat under Options &gt; OSC.<br />
      If OSC is already enabled, switch to another avatar, then back.<br />Avatar data loads when
      VRChat sends an OSC response.
    </p>
    <p v-else-if="status.state === 'ready'">
      If your avatar is already loaded, switch to another avatar, then back.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.waiting {
  &__skip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
  }

  &__help {
    margin-top: 24px;
    text-align: center;
  }

  &__header {
    font-weight: 700;
    white-space: pre-line;
  }
}
</style>
