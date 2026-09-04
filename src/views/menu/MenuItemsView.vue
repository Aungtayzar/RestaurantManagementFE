<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { ArrowPathIcon, MagnifyingGlassIcon, PencilIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { getMenuItems, updateMenuItem } from '@/api/menuItems'
import { getCategories } from '@/api/categories'
import CategoryFormModal from '@/components/menu/CategoryFormModal.vue'
import MenuItemDetailModal from '@/components/menu/MenuItemDetailModal.vue'
import MenuItemFormModal from '@/components/menu/MenuItemFormModal.vue'
import MenuItemRow from '@/components/menu/MenuItemRow.vue'
import MenuItemRowSkeleton from '@/components/menu/MenuItemRowSkeleton.vue'

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
const isCategoryCreateOpen = ref(false)
const editingCategory = ref(null)
const isInitialized = ref(false)
let searchTimeout

const selectedCategoryRecord = computed(() =>
  categories.value.find((category) => String(category.id) === selectedCategory.value),
)
const visibleItems = computed(() => menuItems.value)
const hasItems = computed(() => visibleItems.value.length > 0)

async function fetchMenuItems() {
  if (!selectedCategory.value) {
    menuItems.value = []
    return
  }
  isLoading.value = true
  error.value = null
  try {
    const data = await getMenuItems({
      search: debouncedSearch.value || undefined,
      category_id: selectedCategory.value,
      available: selectedAvailability.value || undefined,
    })
    menuItems.value = data.data ?? []
  } catch {
    error.value = 'Failed to load menu items. Please try again.'
    menuItems.value = []
  } finally {
    isLoading.value = false
  }
}

async function fetchCategories({ preferredCategoryId } = {}) {
  try {
    const data = await getCategories({ per_page: 100 })
    categories.value = data.data ?? []
    const preferred = String(preferredCategoryId ?? selectedCategory.value)
    selectedCategory.value = categories.value.some((category) => String(category.id) === preferred)
      ? preferred
      : String(categories.value[0]?.id ?? '')
  } catch {
    categories.value = []
    selectedCategory.value = ''
    toast.error('Failed to load categories. Please try again.')
  }
}

async function initialize() {
  await fetchCategories()
  await fetchMenuItems()
  isInitialized.value = true
}

function closeFormModal() {
  isCreateOpen.value = false
  editingItem.value = null
}

async function handleSaved() {
  closeFormModal()
  await fetchMenuItems()
}

function closeCategoryModal() {
  isCategoryCreateOpen.value = false
  editingCategory.value = null
}

async function handleCategorySaved(category) {
  const categoryId = category?.id ?? editingCategory.value?.id ?? selectedCategory.value
  closeCategoryModal()
  await fetchCategories({ preferredCategoryId: categoryId })
  await fetchMenuItems()
}

function closeDetailModal() {
  detailItemId.value = null
}

async function handleDetailDeleted() {
  closeDetailModal()
  await fetchMenuItems()
}

function handleDetailEdit(item) {
  closeDetailModal()
  editingItem.value = item
}

async function handleToggleAvailability({ id, currentStatus, newStatus }) {
  if (updatingItems.value[id]) return
  const item = visibleItems.value.find((candidate) => candidate.id === id)
  if (!item) return
  const originalStatus = item.is_available
  const nextStatus = newStatus ?? !currentStatus
  item.is_available = nextStatus
  updatingItems.value[id] = true
  const formData = new FormData()
  formData.append('is_available', nextStatus ? '1' : '0')
  try {
    await updateMenuItem(id, formData)
    toast.success(nextStatus ? 'Item marked as available' : 'Item marked as unavailable')
  } catch {
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
watch([debouncedSearch, selectedCategory, selectedAvailability], () => {
  if (isInitialized.value) fetchMenuItems()
})
initialize()
onUnmounted(() => clearTimeout(searchTimeout))
</script>

<template>
  <div>
    <h1 class="text-secondary-900 mb-6 text-2xl font-bold">Menu Items</h1>

    <div class="grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        class="border-secondary-200 flex max-h-[32rem] flex-col rounded-xl border bg-white p-4 shadow-sm lg:sticky lg:top-5 lg:h-[calc(100vh-9rem)] lg:max-h-none"
      >
        <h2 class="text-secondary-900 mb-3 text-sm font-semibold">Categories</h2>
        <div
          data-testid="category-scroll-region"
          class="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1"
        >
          <p v-if="categories.length === 0" class="text-secondary-500 py-8 text-center text-sm">
            No categories found.
          </p>
          <div
            v-for="category in categories"
            :key="category.id"
            class="group flex items-center rounded-lg transition-colors"
            :class="
              selectedCategory === String(category.id) ? 'bg-primary-50' : 'hover:bg-secondary-50'
            "
          >
            <button
              type="button"
              class="min-w-0 flex-1 px-3 py-2.5 text-left text-sm font-medium"
              :class="
                selectedCategory === String(category.id) ? 'text-primary-700' : 'text-secondary-700'
              "
              :aria-current="selectedCategory === String(category.id) ? 'true' : undefined"
              @click="selectedCategory = String(category.id)"
            >
              <span class="block truncate">{{ category.name }}</span>
            </button>
            <span
              class="mr-1 rounded-md px-2 py-0.5 text-xs font-semibold"
              :class="
                selectedCategory === String(category.id)
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-500'
              "
            >
              {{ category.menu_items_count ?? 0 }}
            </span>
            <button
              type="button"
              :aria-label="`Edit ${category.name}`"
              class="text-secondary-400 hover:text-primary-600 mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition"
              @click="editingCategory = category"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          type="button"
          class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition focus:ring-2 focus:outline-none"
          @click="isCategoryCreateOpen = true"
        >
          <PlusIcon class="h-4 w-4" /> New Category
        </button>
      </aside>

      <main class="min-w-0">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-secondary-900 text-lg font-semibold">
              {{ selectedCategoryRecord?.name ?? 'Menu items' }}
            </h2>
            <p class="text-secondary-500 text-sm">Manage Menu items in this category</p>
          </div>
          <button
            type="button"
            class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!selectedCategory"
            @click="isCreateOpen = true"
          >
            <PlusIcon class="h-4 w-4" /> New Item
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
            class="text-danger-700 hover:text-danger-800 mt-2 inline-flex items-center gap-1.5 font-semibold"
            @click="fetchMenuItems"
          >
            <ArrowPathIcon class="h-4 w-4" /> Retry
          </button>
        </div>
        <p
          v-else-if="!hasItems"
          class="text-secondary-500 border-secondary-200 rounded-xl border bg-white py-24 text-center text-sm shadow-sm"
        >
          No menu items found in this category.
        </p>
        <div
          v-else
          class="border-secondary-200 divide-secondary-200 divide-y overflow-hidden rounded-xl border bg-white shadow-sm"
        >
          <MenuItemRow
            v-for="item in visibleItems"
            :key="item.id"
            :menu-item="item"
            :updating="!!updatingItems[item.id]"
            @toggle-availability="handleToggleAvailability"
            @edit="editingItem = item"
            @view="detailItemId = item.id"
          />
        </div>
      </main>
    </div>

    <CategoryFormModal
      :open="isCategoryCreateOpen || !!editingCategory"
      :category="editingCategory"
      @close="closeCategoryModal"
      @saved="handleCategorySaved"
    />
    <MenuItemFormModal
      :open="!!editingItem || isCreateOpen"
      :categories="categories"
      :menu-item="editingItem"
      :default-category-id="selectedCategory"
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
