<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'
import { getBranches } from '@/api/branches'
import { getKitchenReport } from '@/api/reports'
import { orderError } from '@/components/orders/orderErrors'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.roles?.includes('admin'))
const canViewReport = computed(() =>
  auth.user?.roles?.some((role) => ['admin', 'manager'].includes(role)),
)
function dateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const today = new Date()
const from = ref(dateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)))
const to = ref(dateInput(today))
const branchId = ref('')
const branches = ref([])
const branchError = ref('')
const report = ref(null)
const error = ref('')
const loading = ref(false)
let requestId = 0
let disposed = false

const dateError = computed(() => {
  if (!from.value || !to.value) return 'Choose both dates.'
  const days =
    (Date.parse(`${to.value}T00:00:00Z`) - Date.parse(`${from.value}T00:00:00Z`)) / 86400000
  if (days < 0) return 'The end date must be on or after the start date.'
  if (days > 89) return 'The report period may not exceed 90 days.'
  return ''
})

const activeStatuses = [
  { key: 'pending', label: 'Pending', detail: 'Waiting to start', tone: 'warning' },
  { key: 'preparing', label: 'Preparing', detail: 'In the kitchen', tone: 'info' },
  { key: 'ready', label: 'Ready', detail: 'Ready for service', tone: 'success' },
]

function formatDuration(seconds) {
  if (seconds == null) return '—'
  const minutes = Math.floor(seconds / 60)
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
}

function resetReport() {
  requestId++
  report.value = null
  error.value = ''
  loading.value = false
}

async function loadReport() {
  if (dateError.value || (isAdmin.value && !branchId.value)) return
  const id = ++requestId
  loading.value = true
  error.value = ''
  report.value = null
  try {
    const result = await getKitchenReport({
      from: from.value,
      to: to.value,
      branch_id: isAdmin.value ? Number(branchId.value) : undefined,
    })
    if (!disposed && id === requestId) report.value = result.data
  } catch (cause) {
    if (!disposed && id === requestId)
      error.value = orderError(cause, 'Could not load the kitchen report. Please try again.')
  } finally {
    if (!disposed && id === requestId) loading.value = false
  }
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

onMounted(() => {
  if (!canViewReport.value) return
  if (isAdmin.value) loadBranches()
  else loadReport()
})
onUnmounted(() => {
  disposed = true
  requestId++
})
</script>

<template>
  <section class="mx-auto max-w-[1500px] space-y-6 pb-8">
    <header class="border-secondary-200 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div class="bg-secondary-900 relative overflow-hidden px-5 py-6 sm:px-7">
        <div
          aria-hidden="true"
          class="bg-primary-500/15 absolute -top-20 right-0 size-64 rounded-full blur-3xl"
        />
        <div class="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p class="text-primary-300 text-xs font-semibold tracking-widest uppercase">
              Restaurant overview
            </p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Dashboard</h1>
            <p class="text-secondary-300 mt-1 text-sm">Welcome back, {{ auth.user?.name }}.</p>
          </div>
          <div
            class="bg-secondary-800/80 border-secondary-700 flex items-center gap-3 rounded-xl border px-4 py-3"
          >
            <FireIcon class="text-primary-400 size-6 shrink-0" aria-hidden="true" />
            <div>
              <p class="text-secondary-400 text-xs">Workspace</p>
              <p class="text-sm font-semibold text-white">Restaurant operations</p>
            </div>
          </div>
        </div>
      </div>
      <form
        v-if="canViewReport"
        class="flex flex-col gap-5 p-5 sm:px-7 lg:flex-row lg:items-end lg:justify-between"
        @submit.prevent="loadReport"
      >
        <div>
          <p class="text-secondary-900 text-sm font-semibold">Reporting period</p>
          <div class="mt-2 flex flex-wrap items-end gap-3">
            <label class="text-secondary-600 flex flex-col gap-1.5 text-xs font-medium"
              >From
              <input
                v-model="from"
                type="date"
                class="border-secondary-300 focus:border-primary-500 focus:ring-primary-100 text-secondary-900 min-h-11 rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                required
                @change="resetReport"
              />
            </label>
            <label class="text-secondary-600 flex flex-col gap-1.5 text-xs font-medium"
              >To
              <input
                v-model="to"
                type="date"
                class="border-secondary-300 focus:border-primary-500 focus:ring-primary-100 text-secondary-900 min-h-11 rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                required
                @change="resetReport"
              />
            </label>
            <button
              type="submit"
              class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 inline-flex min-h-11 items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm focus:ring-2 focus:outline-none disabled:opacity-50"
              :disabled="loading || Boolean(dateError) || (isAdmin && !branchId)"
            >
              <ArrowPathIcon
                class="size-4"
                :class="{ 'animate-spin': loading }"
                aria-hidden="true"
              />
              {{ loading ? 'Loading…' : 'Apply' }}
            </button>
          </div>
        </div>
        <div v-if="isAdmin" class="flex items-end gap-2 lg:min-w-56">
          <BuildingStorefrontIcon
            class="text-primary-600 mb-3 size-5 shrink-0"
            aria-hidden="true"
          />
          <label class="text-secondary-600 flex w-full flex-col gap-1.5 text-xs font-medium">
            Branch
            <select
              v-model="branchId"
              class="border-secondary-300 focus:border-primary-500 focus:ring-primary-100 text-secondary-900 min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              required
              @change="resetReport"
            >
              <option value="">Select a branch</option>
              <option v-for="branch in branches" :key="branch.id" :value="String(branch.id)">
                {{ branch.name }}
              </option>
            </select>
          </label>
        </div>
      </form>
      <template v-if="canViewReport">
        <p v-if="dateError" role="alert" class="text-danger-700 px-5 pb-4 text-sm sm:px-7">
          {{ dateError }}
        </p>
        <p v-if="branchError" role="alert" class="text-danger-700 px-5 pb-4 text-sm sm:px-7">
          {{ branchError }}
          <button type="button" class="underline" @click="loadBranches">Retry</button>
        </p>
      </template>
    </header>

    <template v-if="canViewReport">
      <p
        v-if="error"
        role="alert"
        class="border-danger-200 bg-danger-50 text-danger-700 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
      >
        <span>{{ error }}</span>
        <button
          type="button"
          class="focus:ring-danger-200 rounded font-semibold underline focus:ring-2 focus:outline-none"
          @click="loadReport"
        >
          Retry
        </button>
      </p>
      <div v-if="loading" role="status" class="space-y-4" aria-label="Loading kitchen report">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in 4"
            :key="card"
            class="bg-secondary-200 h-36 animate-pulse rounded-2xl"
          />
        </div>
        <div class="bg-secondary-200 h-64 animate-pulse rounded-2xl" />
        <span class="sr-only">Loading kitchen report…</span>
      </div>
      <div
        v-else-if="isAdmin && !branchId && !branchError"
        class="border-secondary-300 rounded-2xl border border-dashed bg-white px-6 py-16 text-center"
      >
        <BuildingStorefrontIcon class="text-primary-500 mx-auto size-10" aria-hidden="true" />
        <h2 class="text-secondary-900 mt-4 text-lg font-semibold">Choose a branch</h2>
        <p class="text-secondary-500 mt-1 text-sm">Select a branch above to see its dashboard.</p>
      </div>

      <template v-if="report">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-primary-700 text-xs font-bold tracking-wider uppercase">
              Kitchen performance
            </p>
            <h2 class="text-secondary-950 mt-1 text-xl font-bold">{{ report.branch.name }}</h2>
          </div>
          <p class="text-secondary-500 text-xs sm:text-sm">
            {{ report.period.from }} – {{ report.period.to }} · {{ report.branch.timezone }}
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            class="bg-secondary-900 relative overflow-hidden rounded-2xl p-5 text-white shadow-sm"
          >
            <div
              aria-hidden="true"
              class="bg-primary-600/20 absolute -right-8 -bottom-12 size-36 rounded-full"
            />
            <div class="relative flex items-start justify-between gap-3">
              <p class="text-secondary-300 text-sm font-medium">Orders received</p>
              <span class="bg-primary-500/20 text-primary-300 rounded-xl p-2"
                ><ChartBarIcon class="size-5" aria-hidden="true"
              /></span>
            </div>
            <p class="relative mt-6 text-3xl font-bold tracking-tight tabular-nums">
              {{ report.summary.orders_received }}
            </p>
            <p class="text-secondary-400 relative mt-1 text-xs">Within selected dates</p>
          </div>
          <div class="border-secondary-200 rounded-2xl border bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <p class="text-secondary-600 text-sm font-medium">Orders readied</p>
              <span class="bg-success-50 text-success-700 rounded-xl p-2"
                ><CheckCircleIcon class="size-5" aria-hidden="true"
              /></span>
            </div>
            <p class="text-secondary-950 mt-6 text-3xl font-bold tracking-tight tabular-nums">
              {{ report.summary.orders_readied }}
            </p>
            <p class="text-secondary-500 mt-1 text-xs">Within selected dates</p>
          </div>
          <div class="border-secondary-200 rounded-2xl border bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <p class="text-secondary-600 text-sm font-medium">Active now</p>
              <span class="bg-warning-50 text-warning-700 rounded-xl p-2"
                ><FireIcon class="size-5" aria-hidden="true"
              /></span>
            </div>
            <p class="text-secondary-950 mt-6 text-3xl font-bold tracking-tight tabular-nums">
              {{ report.live_active_orders.total }}
            </p>
            <p class="text-secondary-500 mt-1 text-xs">Current branch activity</p>
          </div>
          <div class="border-secondary-200 rounded-2xl border bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <p class="text-secondary-600 text-sm font-medium">Avg kitchen time</p>
              <span class="bg-info-50 text-info-700 rounded-xl p-2"
                ><ClockIcon class="size-5" aria-hidden="true"
              /></span>
            </div>
            <p class="text-secondary-950 mt-6 text-3xl font-bold tracking-tight tabular-nums">
              {{ formatDuration(report.durations_seconds.total_kitchen.average) }}
            </p>
            <p class="text-secondary-500 mt-1 text-xs">
              {{ report.durations_seconds.total_kitchen.sample_size }} timed orders
            </p>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <section class="border-secondary-200 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-secondary-950 text-lg font-bold">Live order flow</h3>
                <p class="text-secondary-500 mt-1 text-sm">Where orders stand right now</p>
              </div>
              <span
                class="bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-xs font-semibold"
                >Live</span
              >
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div
                v-for="status in activeStatuses"
                :key="status.key"
                class="rounded-xl border p-4"
                :class="{
                  'border-warning-200 bg-warning-50/70': status.tone === 'warning',
                  'border-info-200 bg-info-50/70': status.tone === 'info',
                  'border-success-200 bg-success-50/70': status.tone === 'success',
                }"
              >
                <p class="text-secondary-700 text-sm font-semibold">{{ status.label }}</p>
                <p class="text-secondary-950 mt-3 text-2xl font-bold tabular-nums">
                  {{ report.live_active_orders[status.key] }}
                </p>
                <p class="text-secondary-500 mt-1 text-xs">{{ status.detail }}</p>
              </div>
            </div>
            <p class="text-secondary-500 mt-4 text-xs">
              Live counts may include orders outside the selected dates.
            </p>
          </section>
          <section class="border-secondary-200 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h3 class="text-secondary-950 text-lg font-bold">Preparation times</h3>
              <p class="text-secondary-500 mt-1 text-sm">Average and longest time by stage</p>
            </div>
            <div class="divide-secondary-100 mt-4 divide-y">
              <div
                v-for="[key, label] in [
                  ['queue', 'Queue'],
                  ['active_preparation', 'Active preparation'],
                  ['total_kitchen', 'Total kitchen'],
                ]"
                :key="key"
                class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span class="text-secondary-700 font-medium">{{ label }}</span>
                <span class="text-secondary-950 font-semibold tabular-nums"
                  >{{ formatDuration(report.durations_seconds[key].average) }}
                  <span class="text-secondary-400 mx-1 font-normal">avg</span>
                  <span class="text-secondary-500 font-normal"
                    >{{ formatDuration(report.durations_seconds[key].longest) }} longest</span
                  ></span
                >
              </div>
            </div>
            <p class="text-secondary-500 mt-2 text-xs">
              {{ report.durations_seconds.total_kitchen.sample_size }} timed orders ·
              {{ report.durations_seconds.excluded_orders }} excluded
            </p>
          </section>
        </div>

        <section class="border-secondary-200 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2 px-5 py-5 sm:px-6">
            <div>
              <h3 class="text-secondary-950 text-lg font-bold">Daily activity</h3>
              <p class="text-secondary-500 mt-1 text-sm">
                Kitchen volume and pace across the period
              </p>
            </div>
            <ChartBarIcon class="text-primary-500 size-6" aria-hidden="true" />
          </div>
          <div
            v-if="!report.daily.length"
            class="border-secondary-100 border-t px-5 py-12 text-center"
          >
            <ChartBarIcon class="text-secondary-300 mx-auto size-8" aria-hidden="true" />
            <p class="text-secondary-600 mt-2 text-sm">No daily activity in this period.</p>
          </div>
          <div v-else class="max-h-96 overflow-auto">
            <table class="w-full min-w-[650px] text-left text-sm">
              <thead class="bg-secondary-50 text-secondary-600 sticky top-0 text-xs uppercase">
                <tr>
                  <th scope="col" class="px-5 py-3 font-semibold">Date</th>
                  <th scope="col" class="px-5 py-3 font-semibold">Received</th>
                  <th scope="col" class="px-5 py-3 font-semibold">Readied</th>
                  <th scope="col" class="px-5 py-3 font-semibold">Avg queue</th>
                  <th scope="col" class="px-5 py-3 font-semibold">Avg preparation</th>
                  <th scope="col" class="px-5 py-3 font-semibold">Avg total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="day in report.daily"
                  :key="day.date"
                  class="border-secondary-100 hover:bg-secondary-50 border-t"
                >
                  <th
                    scope="row"
                    class="text-secondary-900 px-5 py-3 font-semibold whitespace-nowrap"
                  >
                    {{ day.date }}
                  </th>
                  <td class="px-5 py-3 tabular-nums">{{ day.orders_received }}</td>
                  <td class="px-5 py-3 tabular-nums">{{ day.orders_readied }}</td>
                  <td class="px-5 py-3">{{ formatDuration(day.average_queue_seconds) }}</td>
                  <td class="px-5 py-3">
                    {{ formatDuration(day.average_active_preparation_seconds) }}
                  </td>
                  <td class="px-5 py-3">{{ formatDuration(day.average_total_kitchen_seconds) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="grid gap-4 lg:grid-cols-2">
          <section class="border-secondary-200 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-secondary-950 text-lg font-bold">Prepared items</h3>
                <p class="text-secondary-500 mt-1 text-sm">Most prepared during this period</p>
              </div>
              <FireIcon class="text-primary-500 size-6" aria-hidden="true" />
            </div>
            <p v-if="!report.prepared_items.length" class="text-secondary-500 mt-4 text-sm">
              No prepared items in this period.
            </p>
            <ol v-else class="divide-secondary-100 mt-4 divide-y text-sm">
              <li
                v-for="(item, index) in report.prepared_items"
                :key="`${item.item_name}-${item.variant_name}`"
                class="flex items-center justify-between gap-3 py-3"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span
                    class="bg-primary-50 text-primary-700 flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    >{{ index + 1 }}</span
                  >
                  <span class="text-secondary-900 min-w-0 font-medium"
                    >{{ item.item_name }}
                    <span v-if="item.variant_name" class="text-secondary-500 font-normal"
                      >({{ item.variant_name }})</span
                    >
                  </span>
                </span>
                <strong class="text-secondary-900 shrink-0 tabular-nums">{{
                  item.quantity
                }}</strong>
              </li>
            </ol>
          </section>
          <section class="border-secondary-200 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-secondary-950 text-lg font-bold">Kitchen team</h3>
                <p class="text-secondary-500 mt-1 text-sm">Orders handled by staff</p>
              </div>
              <UsersIcon class="text-primary-500 size-6" aria-hidden="true" />
            </div>
            <p v-if="!report.employees.length" class="text-secondary-500 mt-4 text-sm">
              No kitchen activity in this period.
            </p>
            <div v-else class="mt-4 overflow-auto">
              <table class="w-full min-w-[420px] text-left text-sm">
                <thead class="text-secondary-500 text-xs uppercase">
                  <tr>
                    <th scope="col" class="pb-2 font-semibold">Name</th>
                    <th scope="col" class="pb-2 font-semibold">Started</th>
                    <th scope="col" class="pb-2 font-semibold">Readied</th>
                    <th scope="col" class="pb-2 font-semibold">Avg preparation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="employee in report.employees"
                    :key="employee.user.id"
                    class="border-secondary-100 border-t"
                  >
                    <th scope="row" class="text-secondary-900 py-3 text-left font-semibold">
                      {{ employee.user.name }}
                    </th>
                    <td class="tabular-nums">{{ employee.orders_started }}</td>
                    <td class="tabular-nums">{{ employee.orders_readied }}</td>
                    <td class="tabular-nums">
                      {{ formatDuration(employee.average_active_preparation_seconds) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </template>
    </template>
  </section>
</template>
