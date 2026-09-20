<script setup>
import { computed, ref } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import BaseButton from '@/components/common/BaseButton.vue'
import { payOrder } from '@/api/orders'
import { formatMoney, orderError } from './orderErrors'

const props = defineProps({
  order: { type: Object, required: true },
})
const emit = defineEmits(['close', 'paid', 'stale'])

const totalCents = computed(() => Math.round(Number(props.order.total) * 100))
const received = ref(formatMoney(props.order.total))
const saving = ref(false)
const error = ref('')

const receivedCents = computed(() => {
  const value = Number(received.value)
  return received.value === '' || !Number.isFinite(value) ? NaN : Math.round(value * 100)
})
const changeCents = computed(() => receivedCents.value - totalCents.value)
const canSubmit = computed(() => Number.isFinite(changeCents.value) && changeCents.value >= 0)
const quickAmounts = computed(() =>
  [0, 5, 10, 20].map((extra) => ((totalCents.value + extra * 100) / 100).toFixed(2)),
)

function close() {
  if (!saving.value) emit('close')
}

async function submit() {
  if (saving.value || !canSubmit.value) return
  saving.value = true
  error.value = ''
  try {
    const result = await payOrder(props.order.id, {
      payment_method: 'cash',
      amount_received: (receivedCents.value / 100).toFixed(2),
    })
    emit('paid', result.data)
  } catch (cause) {
    error.value = orderError(cause, 'Could not record the payment. Please try again.')
    if ([409, 422].includes(cause.response?.status)) emit('stale')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog open class="relative z-50" @close="close">
    <div class="fixed inset-0 bg-black/40" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <DialogTitle class="text-secondary-900 text-lg font-semibold">Take payment</DialogTitle>
            <p class="text-secondary-500 mt-1 text-sm">{{ order.order_number }}</p>
          </div>
          <button
            type="button"
            class="text-secondary-400 hover:text-secondary-700"
            aria-label="Close"
            @click="close"
          >
            <XMarkIcon class="size-5" />
          </button>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="submit">
          <div class="bg-secondary-50 flex items-center justify-between rounded-lg p-4">
            <span class="text-secondary-500 text-sm">Total due</span>
            <span class="text-secondary-900 text-2xl font-semibold tabular-nums">{{
              formatMoney(order.total)
            }}</span>
          </div>
          <p class="text-secondary-500 text-sm">Payment method: <strong>Cash</strong></p>
          <div>
            <label for="amount-received" class="text-secondary-500 mb-1.5 block text-xs font-medium"
              >Amount received</label
            >
            <input
              id="amount-received"
              v-model="received"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              class="border-secondary-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="amount in quickAmounts"
                :key="amount"
                type="button"
                class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 rounded-full border px-3 py-1 text-xs font-medium tabular-nums"
                @click="received = amount"
              >
                {{ amount }}
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between text-sm" aria-live="polite">
            <span class="text-secondary-500">Change due</span>
            <span
              class="font-semibold tabular-nums"
              :class="canSubmit ? 'text-success-700' : 'text-danger-700'"
              >{{ canSubmit ? (changeCents / 100).toFixed(2) : 'Amount is too low' }}</span
            >
          </div>
          <p v-if="error" role="alert" class="bg-danger-50 text-danger-700 rounded-lg p-3 text-sm">
            {{ error }}
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <BaseButton variant="outline" :disabled="saving" @click="close">Cancel</BaseButton>
            <BaseButton type="submit" :loading="saving" :disabled="!canSubmit"
              >Confirm payment</BaseButton
            >
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>
