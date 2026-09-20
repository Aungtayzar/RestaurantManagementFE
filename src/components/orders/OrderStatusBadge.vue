<script setup>
import { computed } from 'vue'

const props = defineProps({ status: { type: String, required: true } })
const styles = {
  pending: 'bg-warning-50 text-warning-700',
  preparing: 'bg-primary-50 text-primary-700',
  ready: 'bg-success-50 text-success-700',
  completed: 'bg-secondary-100 text-secondary-600',
}
const classes = computed(() => styles[props.status] ?? styles.completed)
</script>

<template>
  <span
    class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
    :class="classes"
    >{{ status }}</span
  >
</template>
