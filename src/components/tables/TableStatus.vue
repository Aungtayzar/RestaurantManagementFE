<script setup>
defineProps({ table: { type: Object, required: true } })
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="
      !table.is_active
        ? 'bg-secondary-100 text-secondary-600'
        : table.status === 'available'
          ? 'bg-success-50 text-success-700'
          : table.status === 'occupied'
            ? 'bg-warning-50 text-warning-700'
            : 'bg-secondary-100 text-secondary-600'
    "
  >
    <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
    {{
      !table.is_active
        ? 'Inactive'
        : table.status === 'available'
          ? 'Available'
          : table.status === 'occupied'
            ? 'Occupied'
            : 'Unknown'
    }}
  </span>
</template>
