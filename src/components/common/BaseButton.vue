<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Root element or component, e.g. 'button', 'a' or RouterLink
  as: { type: [String, Object], default: 'button' },
  type: { type: String, default: 'button' },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) =>
      ['primary', 'secondary', 'outline', 'ghost', 'danger', 'danger-outline'].includes(v),
  },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg', 'icon'].includes(v) },
  rounded: {
    type: String,
    default: 'lg',
    validator: (v) => ['md', 'lg', 'xl', 'full'].includes(v),
  },
  block: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-200 disabled:bg-primary-300',
  secondary:
    'bg-secondary-800 text-white hover:bg-secondary-900 focus-visible:ring-secondary-300 disabled:bg-secondary-400',
  outline:
    'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 focus-visible:ring-secondary-200',
  ghost: 'text-secondary-700 hover:bg-secondary-100 focus-visible:ring-secondary-200',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-200 disabled:bg-danger-400',
  'danger-outline':
    'border border-danger-300 bg-white text-danger-600 hover:bg-danger-50 focus-visible:ring-danger-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  icon: 'p-2 text-sm',
}

const radii = { md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full' }

const isButton = computed(() => props.as === 'button')
const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() => [
  'inline-flex cursor-pointer items-center justify-center font-semibold transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
  variants[props.variant],
  sizes[props.size],
  radii[props.rounded],
  props.block && 'w-full',
])
</script>

<template>
  <component
    :is="as"
    :type="isButton ? type : undefined"
    :disabled="isButton ? isDisabled : undefined"
    :aria-disabled="!isButton && isDisabled ? 'true' : undefined"
    :aria-busy="loading || undefined"
    :class="classes"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
      <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot v-else name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </component>
</template>
