<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { PlusIcon } from '@heroicons/vue/20/solid'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { getMenuItems, updateMenuItem } from '@/api/menuItems'
import { getCategories } from '@/api/categories'
import { toast } from 'vue3-toastify'
import MenuItemRow from '@/components/menu/MenuItemRow.vue'
import MenuItemRowSkeleton from '@/components/menu/MenuItemRowSkeleton.vue'
import MenuItemFormModal from '@/components/menu/MenuItemFormModal.vue'
import MenuItemDetailModal from '@/components/menu/MenuItemDetailModal.vue'

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: '1', label: 'Available' },
  { value: '0', label: 'Unavailable' },
]

const menuItems = ref([])
const categories = ref([])
const isLoading = ref(false)
const error = ref(null)

const search = ref('')
const debouncedSearch = ref('')
const selectedCategory = ref('')
const selectedAvailability = ref('')

const isCreateOpen = ref(false)
const editingItem = ref(null)
const detailItemId = ref(null)
const updatingItems = ref({})
const collapsedCategories = ref(new Set())

let searchTimeout

const groupedCategories = computed(() =>
  (menuItems.value ?? []).filter((category) => (category.items ?? []).length > 0),
)

const hasItems = computed(() => groupedCategories.value.length > 0)

async function fetchMenuItems() {
  isLoading.value = true
  error.value = null

  try {
    const data = await getMenuItems({
      search: debouncedSearch.value || undefined,
      category_id: selectedCategory.value || undefined,
      available: selectedAvailability.value || undefined,
    })
    menuItems.value = data.data
  } catch {
    error.value = 'Failed to load menu items. Please try again.'
    menuItems.value = []
  } finally {
    isLoading.value = false
  }
}

async function fetchCategories() {
  try {
    const data = await getCategories({ per_page: 100 })
    categories.value = data.data
  } catch {
    categories.value = []
    toast.error('Failed to load categories. Please try again.')
  }
}

function closeFormModal() {
  isCreateOpen.value = false
  editingItem.value = null
}

function handleSaved() {
  closeFormModal()
  fetchMenuItems()
}

function handleView(itemId) {
  detailItemId.value = itemId
}

function closeDetailModal() {
  detailItemId.value = null
}

function handleDetailDeleted() {
  closeDetailModal()
  fetchMenuItems()
}

function handleDetailEdit(item) {
  closeDetailModal()
  editingItem.value = item
}

function handleRowEdit(item) {
  editingItem.value = item
}

function toggleCategory(categoryId) {
  const collapsed = new Set(collapsedCategories.value)

  if (collapsed.has(categoryId)) {
    collapsed.delete(categoryId)
  } else {
    collapsed.add(categoryId)
  }

  collapsedCategories.value = collapsed
}

async function handleToggleAvailability({ id, newStatus }) {
  if (updatingItems.value[id]) return

  const category = menuItems.value.find((category) =>
    category.items?.some((item) => item.id === id),
  )

  const item = category?.items?.find((item) => item.id === id)

  if (!item) return

  const originalStatus = item.is_available

  // Optimistic update
  item.is_available = newStatus
  updatingItems.value[id] = true

  const formData = new FormData()
  formData.append('is_available', newStatus ? '1' : '0')

  try {
    await updateMenuItem(id, formData)
  } catch {
    // Rollback
    item.is_available = originalStatus

    toast.error('Failed to update availability. Please try again.')
  } finally {
    delete updatingItems.value[id]
  }
}

watch(search, (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = value.trim()
  }, 300)
})

watch([debouncedSearch, selectedCategory, selectedAvailability], () => fetchMenuItems(), {
  immediate: true,
})

fetchCategories()

onUnmounted(() => clearTimeout(searchTimeout))
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-secondary-900 text-2xl font-bold">Menu Items</h1>
      </div>
      <button
        type="button"
        class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none"
        @click="isCreateOpen = true"
      >
        <PlusIcon class="h-4 w-4" />
        New Item
      </button>
    </div>

    <div
      class="border-secondary-200 mb-5 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
    >
      <div class="relative w-full sm:max-w-xs">
        <MagnifyingGlassIcon
          class="text-secondary-400 pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
        />
        <label for="menu-search" class="sr-only">Search menu items</label>
        <input
          id="menu-search"
          v-model="search"
          type="search"
          placeholder="Search by name"
          class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 block w-full rounded-lg border py-2.5 pr-3.5 pl-10 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      <div class="w-full sm:w-auto">
        <label for="menu-category-filter" class="sr-only">Filter by category</label>
        <select
          id="menu-category-filter"
          v-model="selectedCategory"
          class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="border-secondary-200 flex rounded-lg border p-0.5">
        <button
          v-for="option in AVAILABILITY_OPTIONS"
          :key="option.value"
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="
            selectedAvailability === option.value
              ? 'bg-primary-600 text-white'
              : 'text-secondary-600 hover:text-secondary-900'
          "
          @click="selectedAvailability = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" role="status" aria-label="Loading menu items">
      <div class="border-secondary-200 overflow-hidden rounded-xl border bg-white shadow-sm">
        <MenuItemRowSkeleton v-for="n in 5" :key="n" />
      </div>
    </div>

    <div
      v-else-if="error"
      class="border-danger-200 bg-danger-50 rounded-lg border px-4 py-3 text-sm"
    >
      <p class="text-danger-700">{{ error }}</p>
      <button
        type="button"
        class="text-danger-700 hover:text-danger-800 mt-2 inline-flex items-center gap-1.5 text-sm font-semibold transition"
        @click="fetchMenuItems"
      >
        <ArrowPathIcon class="h-4 w-4" />
        Retry
      </button>
    </div>

    <p
      v-else-if="!hasItems"
      class="text-secondary-500 border-secondary-200 rounded-xl border bg-white py-24 text-center text-sm shadow-sm"
    >
      No menu items found.
    </p>

    <div v-else class="space-y-6">
      <section
        v-for="category in groupedCategories"
        :key="category.id"
        class="border-secondary-200 rounded-xl border bg-white shadow-sm"
      >
        <header class="border-secondary-200 relative flex items-center gap-3 border-b px-4 py-3">
          <h2 class="text-secondary-900 text-base font-semibold">{{ category.name }}</h2>
          <span class="text-secondary-400 text-xs font-medium">
            {{ category.menu_items_count }} items visible to consumer
          </span>

          <button
            type="button"
            class="border-secondary-200 text-secondary-500 hover:border-primary-300 hover:text-primary-600 focus:ring-primary-200 absolute bottom-0 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-sm transition focus:ring-2 focus:outline-none"
            :aria-label="`${collapsedCategories.has(category.id) ? 'Expand' : 'Collapse'} ${category.name}`"
            :aria-expanded="!collapsedCategories.has(category.id)"
            :aria-controls="`category-items-${category.id}`"
            @click="toggleCategory(category.id)"
          >
            <ChevronDownIcon
              class="h-4 w-4 transition-transform"
              :class="{ 'rotate-180': !collapsedCategories.has(category.id) }"
            />
          </button>
        </header>

        <Transition name="category-items">
          <div
            v-show="!collapsedCategories.has(category.id)"
            :id="`category-items-${category.id}`"
            class="divide-secondary-200 divide-y"
          >
            <MenuItemRow
              v-for="item in category.items"
              :key="item.id"
              :menu-item="item"
              :updating="!!updatingItems[item.id]"
              @toggle-availability="handleToggleAvailability"
              @edit="handleRowEdit(item)"
              @view="handleView(item.id)"
            />
          </div>
        </Transition>
      </section>
    </div>

    <MenuItemFormModal
      :open="!!editingItem || isCreateOpen"
      :categories="categories"
      :menu-item="editingItem"
      @close="closeFormModal"
      @saved="handleSaved"
    />

    <MenuItemDetailModal
      :open="!!detailItemId"
      :menu-item-id="detailItemId"
      @close="closeDetailModal"
      @deleted="handleDetailDeleted"
      @edit="handleDetailEdit"
    />
  </div>
</template>

<style scoped>
.category-items-enter-active,
.category-items-leave-active {
  overflow: hidden;
  transition:
    max-height 250ms ease,
    opacity 200ms ease;
}

.category-items-enter-from,
.category-items-leave-to {
  max-height: 0;
  opacity: 0;
}

.category-items-enter-to,
.category-items-leave-from {
  max-height: 2000px;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .category-items-enter-active,
  .category-items-leave-active {
    transition: none;
  }
}
</style>
