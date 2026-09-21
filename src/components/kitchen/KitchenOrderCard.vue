<script setup>
import { computed } from 'vue'
import { ClockIcon, MapPinIcon, ShoppingBagIcon } from '@heroicons/vue/24/outline'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  order: { type: Object, required: true },
  now: { type: Number, required: true },
  updating: { type: Boolean, default: false },
})

defineEmits(['advance'])

const isPending = computed(() => props.order.status === 'pending')
const elapsedMinutes = computed(() =>
  Math.max(0, Math.floor((props.now - new Date(props.order.created_at).getTime()) / 60000)),
)
const elapsedLabel = computed(() => {
  if (elapsedMinutes.value < 60) return `${elapsedMinutes.value} min`
  const hours = Math.floor(elapsedMinutes.value / 60)
  const minutes = elapsedMinutes.value % 60
  return `${hours}h ${minutes}m`
})
const urgencyClass = computed(() => {
  if (elapsedMinutes.value >= 30) return 'bg-danger-100 text-danger-700'
  if (elapsedMinutes.value >= 15) return 'bg-warning-100 text-warning-800'
  return 'bg-secondary-100 text-secondary-600'
})
const destination = computed(() =>
  props.order.type === 'dine_in' ? (props.order.table?.name ?? 'Dine-in') : 'Takeaway',
)
</script>

<template>
  <article
    class="border-secondary-200 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm"
    :aria-label="`Order ${order.order_number}`"
  >
    <div class="h-1.5" :class="isPending ? 'bg-warning-400' : 'bg-info-500'" />
    <div class="flex flex-1 flex-col p-4 sm:p-5">
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-secondary-500 text-xs font-semibold tracking-wide uppercase">Order</p>
          <h3 class="text-secondary-950 mt-0.5 truncate text-lg font-bold">
            {{ order.order_number }}
          </h3>
        </div>
        <span
          class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
          :class="urgencyClass"
        >
          <ClockIcon class="size-3.5" />
          {{ elapsedLabel }}
        </span>
      </header>

      <div class="text-secondary-600 mt-3 flex items-center gap-2 text-sm font-medium">
        <MapPinIcon v-if="order.type === 'dine_in'" class="size-4" />
        <ShoppingBagIcon v-else class="size-4" />
        {{ destination }}
      </div>

      <ul class="divide-secondary-100 mt-4 flex-1 divide-y border-y border-slate-100">
        <li v-for="item in order.items" :key="item.id" class="py-3">
          <div class="flex gap-3">
            <span
              class="bg-secondary-900 flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            >
              {{ item.quantity }}
            </span>
            <div class="min-w-0">
              <p class="text-secondary-900 font-semibold">{{ item.item_name }}</p>
              <p v-if="item.variant_name" class="text-secondary-500 mt-0.5 text-xs">
                {{ item.variant_name }}
              </p>
              <p
                v-if="item.notes"
                class="bg-warning-50 text-warning-900 mt-2 rounded-lg px-2.5 py-2 text-sm font-medium"
              >
                Note: {{ item.notes }}
              </p>
            </div>
          </div>
        </li>
      </ul>

      <BaseButton
        class="mt-4 min-h-12"
        :variant="isPending ? 'secondary' : 'primary'"
        size="lg"
        block
        :loading="updating"
        @click="$emit('advance', order)"
      >
        {{ isPending ? 'Start preparing' : 'Mark as ready' }}
      </BaseButton>
    </div>
  </article>
</template>
