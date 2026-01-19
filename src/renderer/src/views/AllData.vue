<script setup lang="ts">
import DataTable from '../components/DataTable.vue'

defineEmits(['notification'])
</script>

<template>
  <div class="all-data">
    <DataTable @notification="$emit('notification', $event)" />
  </div>
</template>

<style scoped>
.all-data {
  height: 100%;
  width: 100%;
}
</style>
