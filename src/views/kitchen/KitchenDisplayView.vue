<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  FireIcon,
} from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { getBranches } from '@/api/branches'
import { getOrders, updateOrderStatus } from '@/api/orders'
import BaseButton from '@/components/common/BaseButton.vue'
import KitchenOrderCard from '@/components/kitchen/KitchenOrderCard.vue'
import { orderError } from '@/components/orders/orderErrors'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.roles?.includes('admin'))
const selectedBranch = ref('')
const branches = ref([])
const branchLoading = ref(false)
const branchError = ref('')
const pendingOrders = ref([])
const preparingOrders = ref([])
const loading = ref(false)
const refreshing = ref(false)
const error = ref('')
const updatedAt = ref('')
const updatingIds = ref(new Set())
const now = ref(Date.now())
let clockTimer
let requestId = 0
let disposed = false

const hasBranch = computed(() => !isAdmin.value || Boolean(selectedBranch.value))
const branchName = computed(
  () =>
    (isAdmin.value
      ? branches.value.find((branch) => String(branch.id) === selectedBranch.value)?.name
      : (auth.user?.branch?.name ?? auth.user?.branch_name)) ?? 'Your assigned branch',
)
const totalActive = computed(() => pendingOrders.value.length + preparingOrders.value.length)

function sortOldestFirst(orders) {
  return [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

async function loadOrders({ silent = false } = {}) {
  if (!hasBranch.value) return
  const id = ++requestId
  if (silent) refreshing.value = true
  else loading.value = true
  error.value = ''
  const filters = {
    branch_id: isAdmin.value ? Number(selectedBranch.value) : undefined,
    page: 1,
  }
  try {
    const [pending, preparing] = await Promise.all([
      getOrders({ ...filters, status: 'pending' }),
      getOrders({ ...filters, status: 'preparing' }),
    ])
    if (disposed || id !== requestId) return
    pendingOrders.value = sortOldestFirst(pending.data ?? [])
    preparingOrders.value = sortOldestFirst(preparing.data ?? [])
    updatedAt.value = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (cause) {
    if (disposed || id !== requestId) return
    error.value = orderError(cause, 'Could not refresh kitchen orders. Please try again.')
  } finally {
    if (!disposed && id === requestId) {
      loading.value = false
      refreshing.value = false
    }
  }
}

async function loadBranches() {
  branchLoading.value = true
  branchError.value = ''
  try {
    const all = []
    let current = 1
    let lastPage = 1
    do {
      const result = await getBranches({ page: current })
      if (disposed) return
      all.push(...(result.data ?? []))
      lastPage = result.meta?.last_page ?? 1
      current++
    } while (current <= lastPage)
    branches.value = all
  } catch (cause) {
    if (!disposed)
      branchError.value = orderError(cause, 'Could not load branches. Please try again.')
  } finally {
    if (!disposed) branchLoading.value = false
  }
}

function setUpdating(id, value) {
  const ids = new Set(updatingIds.value)
  if (value) ids.add(id)
  else ids.delete(id)
  updatingIds.value = ids
}

async function advanceOrder(order) {
  if (updatingIds.value.has(order.id)) return
  const nextStatus = order.status === 'pending' ? 'preparing' : 'ready'
  setUpdating(order.id, true)
  try {
    const result = await updateOrderStatus(order.id, nextStatus)
    const updated = result.data ?? { ...order, status: nextStatus }
    pendingOrders.value = pendingOrders.value.filter((item) => item.id !== order.id)
    preparingOrders.value = preparingOrders.value.filter((item) => item.id !== order.id)
    if (nextStatus === 'preparing') {
      preparingOrders.value = sortOldestFirst([...preparingOrders.value, updated])
      toast.success(`${order.order_number} is now preparing`)
    } else {
      toast.success(`${order.order_number} is ready for service`)
    }
  } catch (cause) {
    toast.error(orderError(cause, 'Could not update this order. Please try again.'))
    await loadOrders({ silent: true })
  } finally {
    setUpdating(order.id, false)
  }
}

watch(selectedBranch, () => {
  pendingOrders.value = []
  preparingOrders.value = []
  loadOrders()
})

onMounted(() => {
  if (isAdmin.value) loadBranches()
  else loadOrders()
  clockTimer = window.setInterval(() => (now.value = Date.now()), 60000)
})

onUnmounted(() => {
  disposed = true
  requestId++
  window.clearInterval(clockTimer)
})
</script>

<template>
  <section class="mx-auto max-w-[1600px] space-y-5">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <FireIcon class="text-primary-600 size-7" />
          <h1 class="text-secondary-950 text-2xl font-bold tracking-tight">Kitchen display</h1>
        </div>
        <p class="text-secondary-500 mt-1 text-sm">
          Active tickets, ordered from oldest to newest.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="hasBranch" class="text-right">
          <p class="text-secondary-900 text-sm font-semibold">{{ totalActive }} active</p>
          <p class="text-secondary-500 text-xs">
            {{ updatedAt ? `Updated ${updatedAt}` : 'Waiting for update' }}
          </p>
        </div>
        <BaseButton
          v-if="hasBranch"
          variant="outline"
          size="icon"
          aria-label="Refresh kitchen orders"
          :disabled="loading || refreshing"
          @click="loadOrders({ silent: true })"
        >
          <template #icon-left>
            <ArrowPathIcon class="size-5" :class="{ 'animate-spin': loading || refreshing }" />
          </template>
        </BaseButton>
      </div>
    </header>

    <div
      class="border-secondary-200 flex min-h-16 items-center gap-3 rounded-xl border bg-white px-4 py-3"
    >
      <BuildingStorefrontIcon class="text-secondary-400 size-5 shrink-0" />
      <div v-if="isAdmin" class="w-full sm:max-w-xs">
        <label for="kitchen-branch" class="text-secondary-500 mb-1 block text-xs font-medium">
          Branch
        </label>
        <select
          id="kitchen-branch"
          v-model="selectedBranch"
          class="border-secondary-300 focus:border-primary-500 focus:ring-primary-100 min-h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
          :disabled="branchLoading"
        >
          <option value="">{{ branchLoading ? 'Loading branches…' : 'Select a branch' }}</option>
          <option v-for="branch in branches" :key="branch.id" :value="String(branch.id)">
            {{ branch.name }}
          </option>
        </select>
      </div>
      <div v-else>
        <p class="text-secondary-500 text-xs">Branch</p>
        <p class="text-secondary-900 mt-0.5 text-sm font-semibold">{{ branchName }}</p>
      </div>
    </div>

    <div
      v-if="branchError || error"
      role="alert"
      class="border-danger-200 bg-danger-50 text-danger-700 flex items-center justify-between gap-4 rounded-xl border p-4 text-sm"
    >
      <span>{{ branchError || error }}</span>
      <button
        type="button"
        class="shrink-0 font-semibold underline"
        @click="branchError ? loadBranches() : loadOrders()"
      >
        Retry
      </button>
    </div>

    <div
      v-if="isAdmin && !selectedBranch && !branchError"
      class="border-secondary-300 rounded-2xl border border-dashed px-6 py-20 text-center"
    >
      <BuildingStorefrontIcon class="text-secondary-300 mx-auto size-10" />
      <h2 class="text-secondary-900 mt-4 font-semibold">Choose a branch to open its kitchen</h2>
      <p class="text-secondary-500 mt-2 text-sm">Active tickets will appear here.</p>
    </div>

    <div v-else-if="loading" role="status" class="grid gap-5 lg:grid-cols-2">
      <div v-for="lane in 2" :key="lane" class="bg-secondary-100 h-80 animate-pulse rounded-2xl" />
      <span class="sr-only">Loading kitchen orders…</span>
    </div>

    <div v-else-if="hasBranch" class="grid items-start gap-5 xl:grid-cols-2">
      <section class="bg-warning-50/50 border-warning-200 rounded-2xl border p-3 sm:p-4">
        <header class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-secondary-950 text-lg font-bold">Pending</h2>
            <p class="text-secondary-500 text-xs">Waiting to be started</p>
          </div>
          <span
            class="bg-warning-200 text-warning-900 flex size-9 items-center justify-center rounded-full text-sm font-bold tabular-nums"
          >
            {{ pendingOrders.length }}
          </span>
        </header>
        <div
          v-if="pendingOrders.length"
          class="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"
        >
          <KitchenOrderCard
            v-for="order in pendingOrders"
            :key="order.id"
            :order="order"
            :now="now"
            :updating="updatingIds.has(order.id)"
            @advance="advanceOrder"
          />
        </div>
        <div
          v-else
          class="border-warning-200 rounded-xl border border-dashed bg-white/70 py-12 text-center"
        >
          <CheckCircleIcon class="text-success-500 mx-auto size-8" />
          <p class="text-secondary-700 mt-2 text-sm font-medium">No pending tickets</p>
        </div>
      </section>

      <section class="bg-info-50/50 border-info-200 rounded-2xl border p-3 sm:p-4">
        <header class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-secondary-950 text-lg font-bold">Preparing</h2>
            <p class="text-secondary-500 text-xs">Currently in the kitchen</p>
          </div>
          <span
            class="bg-info-200 text-info-900 flex size-9 items-center justify-center rounded-full text-sm font-bold tabular-nums"
          >
            {{ preparingOrders.length }}
          </span>
        </header>
        <div
          v-if="preparingOrders.length"
          class="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"
        >
          <KitchenOrderCard
            v-for="order in preparingOrders"
            :key="order.id"
            :order="order"
            :now="now"
            :updating="updatingIds.has(order.id)"
            @advance="advanceOrder"
          />
        </div>
        <div
          v-else
          class="border-info-200 rounded-xl border border-dashed bg-white/70 py-12 text-center"
        >
          <CheckCircleIcon class="text-success-500 mx-auto size-8" />
          <p class="text-secondary-700 mt-2 text-sm font-medium">Nothing being prepared</p>
        </div>
      </section>
    </div>
  </section>
</template>
