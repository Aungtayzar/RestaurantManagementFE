<script setup>
import { formatMoney } from '@/components/orders/orderErrors'

defineProps({ summary: { type: Object, required: true } })
const cards = [
  { key: 'total_collected', label: 'Total collected' },
  { key: 'dine_in_total', label: 'Dine-in collected' },
  { key: 'takeaway_total', label: 'Takeaway collected' },
  { key: 'paid_order_count', label: 'Paid orders', count: true },
  { key: 'subtotal', label: 'Subtotal before charges' },
  { key: 'tax_amount', label: 'Tax' },
  { key: 'service_charge_amount', label: 'Service charge' },
]
</script>

<template>
  <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="card in cards"
      :key="card.key"
      class="border-secondary-200 rounded-xl border p-5 shadow-sm"
      :class="
        card.key === 'total_collected'
          ? 'bg-secondary-900 text-white'
          : 'text-secondary-900 bg-white'
      "
    >
      <dt class="text-sm font-medium">{{ card.label }}</dt>
      <dd class="mt-4 text-2xl font-bold tabular-nums">
        {{ card.count ? summary[card.key] : formatMoney(summary[card.key]) }}
      </dd>
    </div>
  </dl>
</template>
