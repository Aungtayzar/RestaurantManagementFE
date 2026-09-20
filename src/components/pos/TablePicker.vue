<script setup>
import { computed } from 'vue'

const props = defineProps({
  tables: { type: Array, default: () => [] },
  modelValue: { type: [Number, String, null], default: null },
})
defineEmits(['update:modelValue'])

const available = computed(() =>
  props.tables.filter((table) => table.is_active && table.status === 'available'),
)
</script>

<template>
  <div>
    <p v-if="!available.length" class="text-warning-600 text-sm">No available tables right now.</p>
    <div v-else class="grid grid-cols-3 gap-2">
      <button
        v-for="table in available"
        :key="table.id"
        type="button"
        :class="[
          'cursor-pointer rounded-lg border px-2 py-2 text-sm',
          modelValue === table.id
            ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
            : 'border-secondary-200 text-secondary-700',
        ]"
        @click="$emit('update:modelValue', table.id)"
      >
        {{ table.name }}
        <span class="text-secondary-400 block text-xs">{{ table.capacity }} seats</span>
      </button>
    </div>
  </div>
</template>
