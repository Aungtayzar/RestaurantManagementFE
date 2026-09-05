<script setup>
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
defineProps({ table: { type: Object, required: true } })
const emit = defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="flex items-center justify-end gap-1">
    <button
      type="button"
      :aria-label="`Edit ${table.name}`"
      class="text-secondary-500 hover:bg-secondary-100 hover:text-secondary-900 rounded-lg p-2.5"
      @click="emit('edit', table)"
    >
      <PencilSquareIcon class="size-5" />
    </button>
    <button
      type="button"
      :aria-label="`Delete ${table.name}`"
      class="text-secondary-400 hover:bg-danger-50 hover:text-danger-600 rounded-lg p-2.5"
      @click="emit('delete', table)"
    >
      <TrashIcon class="size-5" />
    </button>
  </div>
</template>
