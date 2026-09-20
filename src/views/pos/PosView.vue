<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { getBranches } from '@/api/branches'
import { getTables } from '@/api/tables'
import { createOrder, getMenu } from '@/api/pos'
import PosItemCard from '@/components/pos/PosItemCard.vue'
import VariantPickerModal from '@/components/pos/VariantPickerModal.vue'
import CartPanel from '@/components/pos/CartPanel.vue'
import { posError } from '@/components/pos/posErrors'

const auth = useAuthStore()
const cart = useCartStore()
const isAdmin = computed(() => auth.user?.roles?.includes('admin'))
const storageKey = `pos:${auth.user?.id ?? 'guest'}:branch`

const branches = ref([])
const selectedBranch = ref('')
const categories = ref([])
const tables = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const activeCategory = ref(null)
const orderType = ref('dine_in')
const tableId = ref(null)
const variantItem = ref(null)
const submitting = ref(false)
let requestId = 0
let disposed = false
let idempotencyKey = null

const branchId = computed(() =>
  isAdmin.value
    ? selectedBranch.value
      ? Number(selectedBranch.value)
      : null
    : (auth.user?.branch?.id ?? auth.user?.branch_id ?? null),
)
const hasBranch = computed(() => !isAdmin.value || Boolean(branchId.value))
const visibleItems = computed(() => {
  const term = search.value.trim().toLowerCase()
  return categories.value
    .filter((category) => !activeCategory.value || category.id === activeCategory.value)
    .flatMap((category) => category.items ?? [])
    .filter((item) => item.is_available && item.name.toLowerCase().includes(term))
})
const canSubmit = computed(
  () =>
    hasBranch.value &&
    cart.lines.length > 0 &&
    (orderType.value === 'takeaway' || Boolean(tableId.value)),
)

async function loadBranches() {
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
    branches.value = all.filter((item) => item.is_active !== false)
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (branches.value.some((item) => String(item.id) === saved)) selectedBranch.value = saved
    } catch {
      /* Storage is optional. */
    }
  } catch (cause) {
    if (!disposed) error.value = posError(cause, 'Could not load branches. Please try again.')
  }
}

async function loadTables() {
  if (!hasBranch.value) return
  try {
    const result = await getTables({ branch_id: isAdmin.value ? branchId.value : undefined })
    if (!disposed) tables.value = result.data ?? []
  } catch (cause) {
    if (!disposed) toast.error(posError(cause, 'Could not load tables.'))
  }
}

async function loadMenu() {
  const id = ++requestId
  if (!hasBranch.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await getMenu({ branch_id: isAdmin.value ? branchId.value : undefined })
    if (disposed || id !== requestId) return
    categories.value = result.data ?? []
  } catch (cause) {
    if (disposed || id !== requestId) return
    categories.value = []
    error.value = posError(cause, 'Could not load the menu. Please try again.')
  } finally {
    if (!disposed && id === requestId) loading.value = false
  }
}

function reload() {
  loadMenu()
  loadTables()
}

function selectItem(item) {
  if (item.variants?.length) variantItem.value = item
  else cart.add(item)
}
function pickVariant(item, variant) {
  cart.add(item, variant)
  variantItem.value = null
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    idempotencyKey ??= crypto.randomUUID()
    const payload = {
      type: orderType.value,
      branch_id: branchId.value ?? undefined,
      table_id: orderType.value === 'dine_in' ? tableId.value : undefined,
      items: cart.toOrderItems(),
    }
    await createOrder(payload, idempotencyKey)
    toast.success('Order placed')
    cart.clear()
    idempotencyKey = null
    tableId.value = null
    loadTables()
  } catch (cause) {
    toast.error(posError(cause, 'Could not place the order. Please try again.'))
  } finally {
    submitting.value = false
  }
}

watch(selectedBranch, () => {
  try {
    sessionStorage.setItem(storageKey, selectedBranch.value)
  } catch {
    /* Storage is optional. */
  }
  cart.clear()
  tableId.value = null
  activeCategory.value = null
  categories.value = []
  tables.value = []
  reload()
})
watch(orderType, () => (tableId.value = null))
// A changed order is a different order, so it must not reuse the previous key.
watch([() => cart.lines, orderType, tableId], () => (idempotencyKey = null), { deep: true })

onMounted(() => (isAdmin.value ? loadBranches() : reload()))
onUnmounted(() => {
  disposed = true
  requestId++
})
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-secondary-900 text-2xl font-semibold tracking-tight">Point of sale</h1>
      <div v-if="isAdmin" class="flex items-center gap-2">
        <label for="pos-branch" class="text-secondary-500 text-sm">Branch</label>
        <select
          id="pos-branch"
          v-model="selectedBranch"
          class="border-secondary-300 rounded-lg border px-3 py-2 text-sm outline-none"
        >
          <option value="" disabled>Select a branch</option>
          <option v-for="branch in branches" :key="branch.id" :value="String(branch.id)">
            {{ branch.name }}
          </option>
        </select>
      </div>
    </header>

    <p v-if="!hasBranch" class="text-secondary-500 text-sm">Select a branch to start an order.</p>
    <div v-else class="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div class="space-y-4">
        <div class="relative">
          <MagnifyingGlassIcon class="text-secondary-400 absolute top-2.5 left-3 size-5" />
          <input
            v-model="search"
            type="search"
            placeholder="Search menu"
            class="border-secondary-200 focus:ring-primary-400 w-full rounded-lg border py-2 pr-3 pl-10 text-sm outline-none focus:ring-1"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            :class="[
              'cursor-pointer rounded-full px-3 py-1 text-sm',
              activeCategory === null ? 'bg-primary-600 text-white' : 'bg-secondary-100',
            ]"
            @click="activeCategory = null"
          >
            All
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            :class="[
              'cursor-pointer rounded-full px-3 py-1 text-sm',
              activeCategory === category.id ? 'bg-primary-600 text-white' : 'bg-secondary-100',
            ]"
            @click="activeCategory = category.id"
          >
            {{ category.name }}
          </button>
        </div>

        <p v-if="loading" class="text-secondary-500 text-sm">Loading menu...</p>
        <div v-else-if="error" class="text-sm text-red-600">
          {{ error }}
          <button type="button" class="cursor-pointer underline" @click="reload">Retry</button>
        </div>
        <p v-else-if="!visibleItems.length" class="text-secondary-500 text-sm">
          No available items found.
        </p>
        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <PosItemCard
            v-for="item in visibleItems"
            :key="item.id"
            :item="item"
            @select="selectItem"
          />
        </div>
      </div>

      <CartPanel
        v-model:order-type="orderType"
        v-model:table-id="tableId"
        :tables="tables"
        :submitting="submitting"
        :can-submit="canSubmit"
        @submit="submit"
      />
    </div>

    <VariantPickerModal :item="variantItem" @pick="pickVariant" @close="variantItem = null" />
  </section>
</template>
