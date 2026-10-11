<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { getPaymentReport } from '@/api/reports'
import { orderError } from '@/components/orders/orderErrors'
import PaymentSummaryCards from './PaymentSummaryCards.vue'

const props = defineProps({
  from: { type: String, required: true },
  to: { type: String, required: true },
  branchId: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
})

const report = ref(null)
const loading = ref(false)
const error = ref('')
let requestId = 0
let disposed = false

async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  report.value = null

  const params = { from: props.from, to: props.to, per_page: 1 }
  if (props.branchId) params.branch_id = Number(props.branchId)

  try {
    const result = await getPaymentReport(params)
    if (!disposed && id === requestId) report.value = result.data
  } catch (cause) {
    if (!disposed && id === requestId) {
      error.value = orderError(cause, 'Could not load payment overview. Please try again.')
    }
  } finally {
    if (!disposed && id === requestId) loading.value = false
  }
}

watch(() => [props.from, props.to, props.branchId], load, { immediate: true })

onUnmounted(() => {
  disposed = true
  requestId++
})
</script>

<template>
  <section aria-labelledby="dashboard-payment-heading" class="space-y-4">
    <div>
      <h2 id="dashboard-payment-heading" class="text-secondary-950 text-xl font-bold">
        Payment overview
      </h2>
      <p class="text-secondary-500 mt-1 text-sm">
        Cash payments · {{ from }} – {{ to }}
        <template v-if="branchId"> · Selected branch</template>
        <template v-else-if="isAdmin"> · All branches</template>
        <template v-else> · Your branch</template>
      </p>
    </div>

    <p v-if="loading" role="status" class="text-secondary-500 rounded-xl bg-white p-6">
      Loading payment overview…
    </p>
    <div v-else-if="error" role="alert" class="bg-danger-50 text-danger-700 rounded-xl p-4">
      {{ error }}
      <button type="button" class="font-semibold underline" @click="load">Retry</button>
    </div>
    <template v-else-if="report">
      <PaymentSummaryCards :summary="report.summary" />
    </template>
  </section>
</template>
