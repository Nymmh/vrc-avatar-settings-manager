<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })

const paths: Record<string, string[]> = {
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  database: [
    'M21 5c0 1.7-4 3-9 3S3 6.7 3 5s4-3 9-3 9 1.3 9 3Z',
    'M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5',
    'M3 12c0 1.7 4 3 9 3s9-1.3 9-3'
  ],
  gear: [
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.86 1.86-.06-.06A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 .95V21h-6v-1.65a1.7 1.7 0 0 0-1-.95 1.7 1.7 0 0 0-1.88.34l-.06.06-1.86-1.86.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.95-1H2v-4h1.65a1.7 1.7 0 0 0 .95-1 1.7 1.7 0 0 0-.34-1.88L4.2 7.06 6.06 5.2l.06.06A1.7 1.7 0 0 0 8 5.6a1.7 1.7 0 0 0 1-.95V3h6v1.65a1.7 1.7 0 0 0 1 .95 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.86 1.86-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .95 1H22v4h-1.65a1.7 1.7 0 0 0-.95 1Z'
  ],
  shuffle: [
    'M18 14l4 4-4 4',
    'M2 18h2c5 0 6-12 12-12h6',
    'M18 2l4 4-4 4',
    'M2 6h2c2.3 0 3.8 2.5 5.2 5',
    'M14.8 15c1.5 2 3 3 5.2 3'
  ],
  save: [
    'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z',
    'M17 21v-8H7v8',
    'M7 3v6h9'
  ],
  refresh: [
    'M20 11a8 8 0 0 0-14.4-4.8L4 8',
    'M4 3v5h5',
    'M4 13a8 8 0 0 0 14.4 4.8L20 16',
    'M20 21v-5h-5'
  ],
  download: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 18v3h16v-3'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 17v4h16v-4'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M6 6l1 15h10l1-15', 'M10 10v7', 'M14 10v7'],
  copy: [
    'M8 4h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
    'M16 4V3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1'
  ],
  file: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
    'M14 2v6h6',
    'M8 13h8',
    'M8 17h8'
  ],
  folder: ['M3 6h6l2 2h10v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z', 'M1 10h20'],
  external: ['M14 3h7v7', 'M21 3l-9 9', 'M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6']
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(path, index) in paths[name] || []" :key="index" :d="path" />
  </svg>
</template>
