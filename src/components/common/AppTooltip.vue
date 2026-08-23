<script setup>
defineProps({
  label: { type: String, required: true },
  placement: {
    type: String,
    default: 'right',
    validator: (value) => ['right', 'left', 'top', 'bottom'].includes(value),
  },
})

const placementClasses = {
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
}
</script>

<template>
  <span
    class="bg-secondary-900 pointer-events-none absolute z-50 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity delay-100 duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
    :class="placementClasses[placement]"
  >
    {{ label }}
  </span>
</template>
