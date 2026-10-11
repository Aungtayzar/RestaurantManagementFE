<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'
import { formatMoney, orderError } from '@/components/orders/orderErrors'
import { getPaymentReport, downloadPaymentReport } from '@/api/reports'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import PaymentSummaryCards from './PaymentSummaryCards.vue'

const props = defineProps({
  summaryOnly: { type: Boolean, default: false },
  initialFilters: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['apply'])
const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.roles?.includes('admin'))
const canExport = computed(() =>
  auth.user?.roles?.some((role) => ['admin', 'manager'].includes(role)),
)
const filters = ref({
  from: '',
  to: '',
  branch_id: '',
  cashier_id: '',
  type: '',
  q: '',
  ...props.initialFilters,
})
const report = ref(null)
const branches = ref([])
const cashiers = ref([])
const branchError = ref('')
const error = ref('')
const exportError = ref('')
const loading = ref(false)
const exporting = ref(false)
const paymentId = ref(null)
const applied = ref({ ...props.initialFilters })
let requestId = 0
let disposed = false

const dateError = computed(() => {
  if (!filters.value.from || !filters.value.to) return 'Choose both dates.'
  const days =
    (Date.parse(`${filters.value.to}T00:00:00Z`) - Date.parse(`${filters.value.from}T00:00:00Z`)) /
    86400000
  if (days < 0) return 'The end date must be on or after the start date.'
  return ''
})

function normalize(values) {
  const params = {}
  for (const key of ['from', 'to', 'type', 'q']) {
    if (values[key]) params[key] = values[key]
  }
  if (isAdmin.value && values.branch_id) params.branch_id = Number(values.branch_id)
  if (canExport.value && values.cashier_id) params.cashier_id = Number(values.cashier_id)
  return params
}

function clearReport() {
  requestId++
  report.value = null
  loading.value = false
  error.value = ''
  exportError.value = ''
}

function changeBranch() {
  filters.value.cashier_id = ''
  cashiers.value = []
  clearReport()
}

async function load(params = applied.value, page = 1) {
  const id = ++requestId
  loading.value = true
  error.value = ''
  report.value = null
  applied.value = { ...params }
  try {
    const result = await getPaymentReport({ ...params, page, per_page: props.summaryOnly ? 1 : 25 })
    if (disposed || id !== requestId) return
    report.value = result.data
    cashiers.value = result.data.cashiers ?? []
    if (!params.from && result.data.branches.length) {
      filters.value.from = result.data.branches[0].from
      filters.value.to = result.data.branches[0].to
    }
  } catch (cause) {
    if (!disposed && id === requestId)
      error.value = orderError(cause, 'Could not load payment report. Please try again.')
  } finally {
    if (!disposed && id === requestId) loading.value = false
  }
}

function apply() {
  if (dateError.value) return
  const params = normalize(filters.value)
  emit('apply', params)
  load(params)
}

function today() {
  const params = normalize({ ...filters.value, from: '', to: '' })
  emit('apply', params)
  load(params)
}

async function loadBranches() {
  branchError.value = ''
  try {
    const all = []
    let page = 1
    let lastPage = 1
    do {
      const result = await getBranches({ page })
      if (disposed) return
      all.push(...(result.data ?? []))
      lastPage = result.meta?.last_page ?? 1
      page++
    } while (page <= lastPage)
    branches.value = all
  } catch (cause) {
    if (!disposed) branchError.value = orderError(cause, 'Could not load branches.')
  }
}

async function download(format) {
  if (exporting.value || !report.value) return
  exporting.value = true
  exportError.value = ''
  try {
    await downloadPaymentReport(applied.value, format)
  } catch (cause) {
    if (!disposed)
      exportError.value = orderError(cause, 'Could not export payment report. Please try again.')
  } finally {
    if (!disposed) exporting.value = false
  }
}

function paymentTime(transaction) {
  return new Date(transaction.paid_at).toLocaleString(undefined, {
    timeZone: transaction.branch.timezone,
  })
}

watch(
  () => props.initialFilters,
  (values) => {
    const params = normalize(values)
    if (JSON.stringify(params) === JSON.stringify(applied.value)) return
    filters.value = { from: '', to: '', branch_id: '', cashier_id: '', type: '', q: '', ...values }
    load(params)
  },
  { deep: true },
)

onMounted(() => {
  if (isAdmin.value) loadBranches()
  load(normalize(props.initialFilters))
})
onUnmounted(() => {
  disposed = true
  requestId++
})
</script>

<template>
  <section aria-label="Payment report" class="space-y-5">
    <header class="border-secondary-200 space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-secondary-950 text-xl font-bold">
            {{ summaryOnly ? 'Payment overview' : 'Payment report' }}
          </h2>
          <p class="text-secondary-500 mt-1 text-sm">
            {{ canExport ? 'Collected sales' : 'Your payments' }} · Cash payments · Dates use each
            branch’s local time.
          </p>
        </div>
        <BaseButton variant="outline" :disabled="loading" @click="today">Today</BaseButton>
      </div>
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="apply">
        <label class="text-secondary-600 flex flex-col gap-1 text-sm"
          >From
          <input
            v-model="filters.from"
            name="from"
            type="date"
            class="border-secondary-300 focus-visible:outline-primary-500 min-h-11 rounded-lg border px-3 py-2"
            required
            @change="clearReport"
          />
        </label>
        <label class="text-secondary-600 flex flex-col gap-1 text-sm"
          >To
          <input
            v-model="filters.to"
            name="to"
            type="date"
            class="border-secondary-300 focus-visible:outline-primary-500 min-h-11 rounded-lg border px-3 py-2"
            required
            @change="clearReport"
          />
        </label>
        <label v-if="isAdmin" class="text-secondary-600 flex flex-col gap-1 text-sm"
          >Branch
          <select
            v-model="filters.branch_id"
            name="branch_id"
            class="border-secondary-300 focus-visible:outline-primary-500 min-h-11 rounded-lg border px-3 py-2"
            @change="changeBranch"
          >
            <option value="">All branches</option>
            <option v-for="branch in branches" :key="branch.id" :value="String(branch.id)">
              {{ branch.name }}
            </option>
          </select>
        </label>
        <label v-if="canExport" class="text-secondary-600 flex flex-col gap-1 text-sm"
          >Cashier who took payment
          <select
            v-model="filters.cashier_id"
            name="cashier_id"
            class="border-secondary-300 focus-visible:outline-primary-500 min-h-11 rounded-lg border px-3 py-2"
            @change="clearReport"
          >
            <option value="">All payment operators</option>
            <option v-for="cashier in cashiers" :key="cashier.id" :value="String(cashier.id)">
              {{ cashier.name }}
            </option>
          </select>
        </label>
        <label class="text-secondary-600 flex flex-col gap-1 text-sm"
          >Order type
          <select
            v-model="filters.type"
            name="type"
            class="border-secondary-300 focus-visible:outline-primary-500 min-h-11 rounded-lg border px-3 py-2"
            @change="clearReport"
          >
            <option value="">All types</option>
            <option value="dine_in">Dine-in</option>
            <option value="takeaway">Takeaway</option>
          </select>
        </label>
        <label class="text-secondary-600 flex flex-col gap-1 text-sm"
          >Order number
          <input
            v-model="filters.q"
            name="q"
            type="search"
            maxlength="100"
            placeholder="Search order number"
            class="border-secondary-300 focus-visible:outline-primary-500 min-h-11 rounded-lg border px-3 py-2"
            @input="clearReport"
          />
        </label>
        <BaseButton type="submit" :loading="loading" :disabled="Boolean(dateError)"
          >Apply</BaseButton
        >
      </form>
      <p v-if="dateError && filters.from" role="alert" class="text-danger-700 text-sm">
        {{ dateError }}
      </p>
      <p v-if="branchError" role="alert" class="text-danger-700 text-sm">
        {{ branchError }} <button class="underline" @click="loadBranches">Retry branches</button>
      </p>
    </header>
    <p v-if="loading" role="status" class="text-secondary-500 rounded-xl bg-white p-6">
      Loading payment report…
    </p>
    <p v-else-if="error" role="alert" class="bg-danger-50 text-danger-700 rounded-xl p-4">
      {{ error }} <button class="font-semibold underline" @click="load()">Retry</button>
    </p>
    <template v-if="report">
      <p class="text-secondary-500 text-sm">
        {{
          report.period.today
            ? 'Today in each selected branch'
            : `${report.period.from} – ${report.period.to}`
        }}
        ·
        {{
          isAdmin
            ? applied.branch_id
              ? 'Selected branch'
              : 'All branches'
            : canExport
              ? 'Your branch'
              : 'Your payments'
        }}
      </p>
      <PaymentSummaryCards :summary="report.summary" />
      <p v-if="!report.summary.paid_order_count" class="text-secondary-500 rounded-xl bg-white p-5">
        No payments match these filters.
      </p>
      <template v-if="!summaryOnly">
        <div v-if="canExport" class="flex flex-wrap gap-3">
          <BaseButton variant="primary" :disabled="exporting" @click="download('csv')"
            >Export CSV</BaseButton
          >
          <BaseButton variant="primary" :disabled="exporting" @click="download('xlsx')"
            >Export Excel</BaseButton
          >
          <span v-if="exporting" role="status" class="text-secondary-500 self-center text-sm"
            >Preparing download…</span
          >
        </div>
        <p v-if="exportError" role="alert" class="text-danger-700 text-sm">{{ exportError }}</p>
        <section
          v-if="isAdmin && !applied.branch_id"
          class="border-secondary-200 overflow-hidden rounded-xl border bg-white p-5"
        >
          <h3 class="text-secondary-900 mb-4 font-semibold">Branch totals</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr>
                  <th scope="col" class="p-2">Branch / timezone</th>
                  <th scope="col" class="p-2">Paid orders</th>
                  <th scope="col" class="p-2">Collected</th>
                  <th scope="col" class="p-2">Dine-in</th>
                  <th scope="col" class="p-2">Takeaway</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="branch in report.branches"
                  :key="branch.id"
                  class="border-secondary-100 border-t"
                >
                  <th scope="row" class="p-2 font-medium">
                    {{ branch.name
                    }}<span class="text-secondary-500 block text-xs"
                      >{{ branch.timezone }} · {{ branch.from }} – {{ branch.to }}</span
                    >
                  </th>
                  <td class="p-2">{{ branch.paid_order_count }}</td>
                  <td class="p-2 tabular-nums">{{ formatMoney(branch.total_collected) }}</td>
                  <td class="p-2 tabular-nums">{{ formatMoney(branch.dine_in_total) }}</td>
                  <td class="p-2 tabular-nums">{{ formatMoney(branch.takeaway_total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section class="border-secondary-200 rounded-xl border bg-white p-5">
          <h3 class="text-secondary-900 mb-4 font-semibold">Daily totals</h3>
          <div class="max-h-80 overflow-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr>
                  <th scope="col" class="p-2">Date</th>
                  <th scope="col" class="p-2">Paid orders</th>
                  <th scope="col" class="p-2">Collected</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="day in report.daily"
                  :key="day.date"
                  class="border-secondary-100 border-t"
                >
                  <th scope="row" class="p-2 font-medium">{{ day.date }}</th>
                  <td class="p-2">{{ day.paid_order_count }}</td>
                  <td class="p-2 tabular-nums">{{ formatMoney(day.total_collected) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section class="border-secondary-200 rounded-xl border bg-white p-5">
          <h3 class="text-secondary-900 mb-4 font-semibold">Payment transactions</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr>
                  <th scope="col" class="p-2">Payment time</th>
                  <th scope="col" class="p-2">Order number</th>
                  <th v-if="isAdmin" scope="col" class="p-2">Branch</th>
                  <th scope="col" class="p-2">Cashier</th>
                  <th scope="col" class="p-2">Type</th>
                  <th scope="col" class="p-2">Order total</th>
                  <th scope="col" class="p-2">Cash received</th>
                  <th scope="col" class="p-2">Change</th>
                  <th scope="col" class="p-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="transaction in report.transactions"
                  :key="transaction.id"
                  class="border-secondary-100 border-t"
                >
                  <td class="p-2">
                    {{ paymentTime(transaction)
                    }}<span class="text-secondary-500 block text-xs">{{
                      transaction.branch.timezone
                    }}</span>
                  </td>
                  <th scope="row" class="p-2 font-medium">{{ transaction.order_number }}</th>
                  <td v-if="isAdmin" class="p-2">{{ transaction.branch.name }}</td>
                  <td class="p-2">{{ transaction.cashier.name }}</td>
                  <td class="p-2">{{ transaction.type === 'dine_in' ? 'Dine-in' : 'Takeaway' }}</td>
                  <td class="p-2 tabular-nums">{{ formatMoney(transaction.total) }}</td>
                  <td class="p-2 tabular-nums">{{ formatMoney(transaction.amount_received) }}</td>
                  <td class="p-2 tabular-nums">{{ formatMoney(transaction.change_amount) }}</td>
                  <td class="p-2">
                    <BaseButton size="sm" variant="outline" @click="paymentId = transaction.id"
                      >View receipt</BaseButton
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <nav
            aria-label="Transaction pages"
            class="mt-5 flex flex-wrap items-center justify-between gap-3"
          >
            <p class="text-secondary-500 text-sm">
              Page {{ report.meta.current_page }} of {{ report.meta.last_page }} ·
              {{ report.meta.total }} payments
            </p>
            <div class="flex gap-2">
              <BaseButton
                variant="outline"
                :disabled="report.meta.current_page <= 1"
                @click="load(applied, report.meta.current_page - 1)"
                >Previous</BaseButton
              ><BaseButton
                variant="outline"
                :disabled="report.meta.current_page >= report.meta.last_page"
                @click="load(applied, report.meta.current_page + 1)"
                >Next</BaseButton
              >
            </div>
          </nav>
        </section>
      </template>
    </template>
    <p v-else-if="!loading && !error" class="text-secondary-500 text-sm">
      Apply filters to view payments.
    </p>
    <OrderDetailModal v-if="paymentId" :payment-id="paymentId" @close="paymentId = null" />
  </section>
</template>
