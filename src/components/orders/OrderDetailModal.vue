<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import BaseButton from '@/components/common/BaseButton.vue'
import { getOrder } from '@/api/orders'
import OrderStatusBadge from './OrderStatusBadge.vue'
import { formatMoney, orderError } from './orderErrors'

const props = defineProps({ orderId: { type: Number, required: true } })
const emit = defineEmits(['close', 'pay'])

const order = ref(null)
const loading = ref(true)
const error = ref('')
let disposed = false

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await getOrder(props.orderId)
    if (!disposed) order.value = result.data
  } catch (cause) {
    if (!disposed) error.value = orderError(cause, 'Could not load the order. Please try again.')
  } finally {
    if (!disposed) loading.value = false
  }
}

onMounted(load)
onUnmounted(() => (disposed = true))
</script>

<template>
  <Dialog open class="relative z-50" @close="emit('close')">
    <div class="fixed inset-0 bg-black/40" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div class="flex items-start justify-between gap-3">
          <DialogTitle class="text-secondary-900 text-lg font-semibold">Order details</DialogTitle>
          <button
            type="button"
            class="text-secondary-400 hover:text-secondary-700"
            aria-label="Close"
            @click="emit('close')"
          >
            <XMarkIcon class="size-5" />
          </button>
        </div>

        <p v-if="loading" role="status" class="text-secondary-500 mt-6 text-sm">Loading order…</p>
        <div
          v-else-if="error"
          role="alert"
          class="bg-danger-50 text-danger-700 mt-5 rounded-lg p-4 text-sm"
        >
          {{ error }}
          <button type="button" class="ml-2 font-semibold underline" @click="load">Retry</button>
        </div>
        <template v-else-if="order">
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <span class="text-secondary-900 font-medium">{{ order.order_number }}</span>
            <OrderStatusBadge :status="order.status" />
          </div>
          <p class="text-secondary-500 mt-1 text-sm">
            {{ order.type === 'dine_in' ? `Dine-in · ${order.table?.name ?? ''}` : 'Takeaway' }}
            · {{ new Date(order.created_at).toLocaleString() }}
          </p>

          <ul class="divide-secondary-100 mt-5 divide-y">
            <li v-for="item in order.items" :key="item.id" class="flex justify-between gap-4 py-3">
              <div class="min-w-0">
                <p class="text-secondary-900 text-sm font-medium">
                  {{ item.quantity }}× {{ item.item_name }}
                </p>
                <p v-if="item.variant_name" class="text-secondary-500 text-xs">
                  {{ item.variant_name }} · {{ formatMoney(item.unit_price) }} each
                </p>
                <p v-if="item.notes" class="text-secondary-500 text-xs italic">
                  Note: {{ item.notes }}
                </p>
              </div>
              <span class="text-secondary-900 text-sm tabular-nums">{{
                formatMoney(item.line_total)
              }}</span>
            </li>
          </ul>

          <dl class="border-secondary-200 mt-2 space-y-1.5 border-t pt-4 text-sm">
            <div class="text-secondary-600 flex justify-between">
              <dt>Subtotal</dt>
              <dd class="tabular-nums">{{ formatMoney(order.subtotal) }}</dd>
            </div>
            <div class="text-secondary-600 flex justify-between">
              <dt>Tax ({{ formatMoney(order.tax_rate) }}%)</dt>
              <dd class="tabular-nums">{{ formatMoney(order.tax_amount) }}</dd>
            </div>
            <div class="text-secondary-600 flex justify-between">
              <dt>Service charge ({{ formatMoney(order.service_charge_rate) }}%)</dt>
              <dd class="tabular-nums">{{ formatMoney(order.service_charge_amount) }}</dd>
            </div>
            <div class="text-secondary-900 flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd class="tabular-nums">{{ formatMoney(order.total) }}</dd>
            </div>
          </dl>

          <div class="mt-6 flex justify-end gap-3">
            <BaseButton variant="outline" @click="emit('close')">Close</BaseButton>
            <BaseButton v-if="order.status === 'ready'" @click="emit('pay', order)"
              >Take payment</BaseButton
            >
          </div>
        </template>
      </DialogPanel>
    </div>
  </Dialog>
</template>
