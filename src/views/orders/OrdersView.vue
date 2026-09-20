<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth'
import { getBranches } from '@/api/branches'
import { getOrders } from '@/api/orders'
import BaseButton from '@/components/common/BaseButton.vue'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'
import OrderStatusBadge from '@/components/orders/OrderStatusBadge.vue'
import PaymentModal from '@/components/orders/PaymentModal.vue'
import { formatMoney, itemSummary, orderError } from '@/components/orders/orderErrors'

const tabs = [
  { value: 'ready', label: 'Ready' },
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'completed', label: 'Completed' },
]

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.roles?.includes('admin'))
const selectedBranch = ref('')
const branches = ref([])
const branchLoading = ref(false)
const branchError = ref('')
const status = ref('ready')
const page = ref(1)
const orders = ref([])
const meta = ref(null)
const summary = ref(null)
const loading = ref(false)
const error = ref('')
const updatedAt = ref('')
const detailId = ref(null)
const paying = ref(null)
let requestId = 0
let disposed = false

const hasBranch = computed(() => !isAdmin.value || Boolean(selectedBranch.value))
const branchName = computed(
  () =>
    (isAdmin.value
      ? branches.value.find((item) => String(item.id) === selectedBranch.value)?.name
      : (auth.user?.branch?.name ?? auth.user?.branch_name)) ?? 'Your assigned branch',
)

async function loadOrders() {
  const id = ++requestId
  if (!hasBranch.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const result = await getOrders({
      branch_id: isAdmin.value ? Number(selectedBranch.value) : undefined,
      status: status.value,
      page: page.value,
    })
    if (disposed || id !== requestId) return
    orders.value = result.data ?? []
    meta.value = result.meta ?? null
    summary.value = result.summary ?? null
    updatedAt.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (cause) {
    if (disposed || id !== requestId) return
    orders.value = []
    error.value = orderError(cause, 'Could not load orders. Please try again.')
  } finally {
    if (!disposed && id === requestId) loading.value = false
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

watch(selectedBranch, () => {
  orders.value = []
  summary.value = null
  page.value = 1
  loadOrders()
})
watch(status, () => {
  page.value = 1
  loadOrders()
})
onMounted(() => (isAdmin.value ? loadBranches() : loadOrders()))
onUnmounted(() => {
  disposed = true
  requestId++
})

function goTo(next) {
  page.value = next
  loadOrders()
}
function startPayment(order) {
  detailId.value = null
  paying.value = order
}
function paid() {
  paying.value = null
  toast.success('Payment recorded')
  loadOrders()
}
function stale() {
  loadOrders()
}
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-secondary-900 text-2xl font-semibold tracking-tight">Orders</h1>
        <p class="text-secondary-500 mt-1 text-sm">
          Review orders and take payment once they are ready.
        </p>
      </div>
    </header>

    <div
      class="border-secondary-200 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <BuildingStorefrontIcon class="text-secondary-400 size-5 shrink-0" />
        <div v-if="isAdmin" class="w-full sm:max-w-xs">
          <label for="orders-branch" class="text-secondary-500 mb-1 block text-xs font-medium"
            >Branch</label
          >
          <select
            id="orders-branch"
            v-model="selectedBranch"
            class="border-secondary-300 focus:border-primary-500 focus:ring-primary-100 min-h-10 w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
            :disabled="branchLoading"
          >
            <option value="">{{ branchLoading ? 'Loading branches…' : 'Select a branch' }}</option>
            <option v-for="item in branches" :key="item.id" :value="String(item.id)">
              {{ item.name }}
            </option>
          </select>
        </div>
        <div v-else>
          <p class="text-secondary-500 text-xs">Branch</p>
          <p class="text-secondary-900 mt-1 text-sm font-medium">{{ branchName }}</p>
        </div>
      </div>
      <div v-if="hasBranch" class="flex items-center gap-3">
        <span v-if="updatedAt && !loading" class="text-secondary-500 text-xs"
          >Updated {{ updatedAt }}</span
        >
        <BaseButton variant="outline" :disabled="loading" @click="loadOrders">
          <template #icon-left
            ><ArrowPathIcon class="size-4" :class="{ 'animate-spin': loading }" /></template
          >Refresh
        </BaseButton>
      </div>
    </div>

    <div
      v-if="branchError"
      role="alert"
      class="bg-danger-50 text-danger-700 rounded-lg p-4 text-sm"
    >
      {{ branchError }}
      <button type="button" class="ml-2 font-semibold underline" @click="loadBranches">
        Retry
      </button>
    </div>
    <div
      v-else-if="!hasBranch"
      class="border-secondary-300 rounded-xl border border-dashed px-6 py-20 text-center"
    >
      <BuildingStorefrontIcon class="text-secondary-400 mx-auto size-9" />
      <h2 class="text-secondary-900 mt-4 font-semibold">Choose a branch to get started</h2>
    </div>

    <template v-if="hasBranch">
      <div class="flex flex-wrap gap-2" role="tablist" aria-label="Order status">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          role="tab"
          :aria-selected="status === tab.value"
          class="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium"
          :class="
            status === tab.value
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50 bg-white'
          "
          @click="status = tab.value"
        >
          {{ tab.label }}
          <span v-if="summary" class="text-xs tabular-nums">{{ summary[tab.value] ?? 0 }}</span>
        </button>
      </div>

      <div
        v-if="error"
        role="alert"
        class="border-danger-200 bg-danger-50 text-danger-700 rounded-lg border p-4 text-sm"
      >
        {{ error }}
        <button type="button" class="ml-2 font-semibold underline" @click="loadOrders">
          Retry
        </button>
      </div>
      <div
        v-else-if="loading"
        role="status"
        class="border-secondary-200 rounded-xl border bg-white p-6"
      >
        <p class="text-secondary-500 text-sm">Loading orders…</p>
        <div v-for="n in 4" :key="n" class="bg-secondary-100 mt-5 h-10 animate-pulse rounded-lg" />
      </div>
      <div
        v-else-if="!orders.length"
        class="border-secondary-200 rounded-xl border bg-white px-6 py-16 text-center"
      >
        <ClipboardDocumentListIcon class="text-secondary-300 mx-auto size-9" />
        <h2 class="text-secondary-900 mt-4 font-semibold">No {{ status }} orders</h2>
        <p class="text-secondary-500 mt-2 text-sm">Orders in this status will appear here.</p>
      </div>
      <div v-else class="border-secondary-200 overflow-x-auto rounded-xl border bg-white">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            Orders for
            {{
              branchName
            }}
          </caption>
          <thead class="border-secondary-200 bg-secondary-50 text-secondary-500 border-b text-xs">
            <tr>
              <th scope="col" class="px-5 py-3 font-medium">Order</th>
              <th scope="col" class="px-4 py-3 font-medium">Type</th>
              <th scope="col" class="px-4 py-3 font-medium">Items</th>
              <th scope="col" class="px-4 py-3 font-medium">Status</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">Total</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-secondary-100 divide-y">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-secondary-50/70">
              <th scope="row" class="text-secondary-900 px-5 py-4 font-medium whitespace-nowrap">
                {{ order.order_number }}
                <span class="text-secondary-400 block text-xs font-normal">{{
                  new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}</span>
              </th>
              <td class="text-secondary-600 px-4 py-4 whitespace-nowrap">
                {{ order.type === 'dine_in' ? (order.table?.name ?? 'Dine-in') : 'Takeaway' }}
              </td>
              <td class="text-secondary-600 max-w-xs px-4 py-4">{{ itemSummary(order.items) }}</td>
              <td class="px-4 py-4"><OrderStatusBadge :status="order.status" /></td>
              <td class="text-secondary-900 px-4 py-4 text-right tabular-nums">
                {{ formatMoney(order.total) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <BaseButton size="sm" variant="outline" @click="detailId = order.id"
                    >View</BaseButton
                  >
                  <BaseButton v-if="order.status === 'ready'" size="sm" @click="paying = order"
                    >Pay</BaseButton
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta && meta.last_page > 1" class="flex items-center justify-between text-sm">
        <BaseButton variant="outline" size="sm" :disabled="page <= 1" @click="goTo(page - 1)"
          >Previous</BaseButton
        >
        <span class="text-secondary-500">Page {{ meta.current_page }} of {{ meta.last_page }}</span>
        <BaseButton
          variant="outline"
          size="sm"
          :disabled="page >= meta.last_page"
          @click="goTo(page + 1)"
          >Next</BaseButton
        >
      </div>
    </template>

    <OrderDetailModal
      v-if="detailId"
      :order-id="detailId"
      @close="detailId = null"
      @pay="startPayment"
    />
    <PaymentModal
      v-if="paying"
      :order="paying"
      @close="paying = null"
      @paid="paid"
      @stale="stale"
    />
  </section>
</template>
