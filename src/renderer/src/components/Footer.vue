<script lang="ts" setup>
import { ref, onMounted } from 'vue'
const version = ref<string>('')

const getVersion = async (): Promise<void> => {
  version.value = await window.appApi.appVersion()
}

onMounted(() => {
  getVersion()
})
</script>
<template>
  <div class="footer">
    <p>Ver: {{ version }}</p>
    <a href="https://jinxxy.com/Nymh" target="_blank" rel="noopener noreferrer">Nymh</a>
    <a href="https://discord.gg/rcCCkbDsY3" target="_blank" rel="noopener noreferrer">Discord</a>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  display: flex;
  flex-flow: row nowrap;
  gap: 16px;
  justify-content: center;
}
</style>
