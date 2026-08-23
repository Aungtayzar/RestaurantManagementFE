<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BuildingOffice2Icon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
} from '@heroicons/vue/24/outline'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/vue/20/solid'
import { getBranches } from '@/api/branches'
import BranchFormModal from '@/components/common/BranchFormModal.vue'
import BranchDetailModal from '@/components/common/BranchDetailModal.vue'
import BranchCardSkeleton from '@/components/common/BranchCardSkeleton.vue'

const route = useRoute()
const router = useRouter()

const branches = ref([])
const meta = ref(null)
const isLoading = ref(false)
const error = ref(null)
const editingBranch = ref(null)
const detailBranchId = ref(null)
const isCreateOpen = ref(false)

const currentPage = computed(() => Number(route.query.page) || 1)

const rangeText = computed(() => {
  if (!meta.value || meta.value.total === 0) return ''
  return `Showing ${meta.value.from}–${meta.value.to} of ${meta.value.total} branches`
})

function formatPercent(value) {
  const number = Number.parseFloat(value)
  return Number.isNaN(number) ? `${value}%` : `${number}%`
}

async function fetchBranches(page) {
  isLoading.value = true
  error.value = null

  try {
    const data = await getBranches({ page })
    branches.value = data.data
    meta.value = data.meta ?? null
  } catch {
    error.value = 'Failed to load branches. Please try again.'
    branches.value = []
    meta.value = null
  } finally {
    isLoading.value = false
  }
}

function goToPage(page) {
  if (!page || page === currentPage.value) return
  router.push({ query: { ...route.query, page } })
}

function closeFormModal() {
  editingBranch.value = null
  isCreateOpen.value = false
}

async function handleSaved(saved) {
  const wasCreate = isCreateOpen.value
  closeFormModal()

  if (wasCreate) {
    await fetchBranches(currentPage.value)
    return
  }
  branches.value = branches.value.map((branch) => (branch.id === saved.id ? saved : branch))
}

watch(
  () => currentPage.value,
  (page) => fetchBranches(page),
  { immediate: true },
)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-secondary-900 text-2xl font-bold">Branches</h1>
        <p class="text-secondary-500 mt-1 text-sm">Manage your restaurant branches</p>
      </div>
      <button
        type="button"
        class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none"
        @click="isCreateOpen = true"
      >
        <PlusIcon class="h-4 w-4" />
        New branch
      </button>
    </div>

    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading branches"
    >
      <BranchCardSkeleton v-for="n in 6" :key="n" />
    </div>

    <div
      v-else-if="error"
      class="border-danger-200 bg-danger-50 text-danger-700 rounded-lg border px-4 py-3 text-sm"
    >
      {{ error }}
    </div>

    <p v-else-if="branches.length === 0" class="text-secondary-500 py-24 text-center text-sm">
      No branches found.
    </p>

    <template v-else>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="branch in branches"
          :key="branch.id"
          class="border-secondary-200 flex flex-col rounded-xl border bg-white shadow-sm transition hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-3 p-5 pb-0">
            <div class="flex min-w-0 items-center gap-3">
              <div class="bg-primary-100 text-primary-600 rounded-lg p-2">
                <BuildingOffice2Icon class="h-6 w-6" />
              </div>
              <h2 class="text-secondary-900 truncate text-base font-semibold">
                {{ branch.name }}
              </h2>
            </div>
            <span
              class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="
                branch.is_active
                  ? 'bg-success-100 text-success-700'
                  : 'bg-secondary-100 text-secondary-600'
              "
            >
              {{ branch.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="text-secondary-600 mt-4 space-y-2 px-5 text-sm">
            <p class="flex items-start gap-2">
              <MapPinIcon class="text-secondary-400 mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ branch.address }}</span>
            </p>
            <p class="flex items-center gap-2">
              <PhoneIcon class="text-secondary-400 h-4 w-4 shrink-0" />
              <span>{{ branch.phone }}</span>
            </p>
          </div>

          <div class="mt-auto px-5 pt-4 pb-5">
            <div class="divide-secondary-200 bg-secondary-50 grid grid-cols-2 divide-x rounded-lg">
              <div class="px-4 py-3">
                <p class="text-secondary-500 text-xs">Tax rate</p>
                <p class="text-secondary-900 mt-0.5 text-base font-semibold">
                  {{ formatPercent(branch.tax_rate) }}
                </p>
              </div>
              <div class="px-4 py-3">
                <p class="text-secondary-500 text-xs">Service charge</p>
                <p class="text-secondary-900 mt-0.5 text-base font-semibold">
                  {{ formatPercent(branch.service_charge) }}
                </p>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 focus:ring-primary-200 hover:border-primary-400 hover:text-primary-600 inline-flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold transition focus:ring-2 focus:outline-none"
                @click="detailBranchId = branch.id"
              >
                Details
              </button>
              <button
                type="button"
                class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus:ring-2 focus:outline-none"
                @click="editingBranch = branch"
              >
                <PencilSquareIcon class="h-4 w-4" />
                Edit
              </button>
            </div>
          </div>
        </article>
      </div>

      <div
        v-if="meta && meta.last_page > 1"
        class="border-secondary-200 mt-6 flex items-center justify-between border-t pt-4"
      >
        <p class="text-secondary-500 text-sm">{{ rangeText }}</p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!meta.links?.prev"
            @click="goToPage(meta.current_page - 1)"
          >
            <ChevronLeftIcon class="h-4 w-4" />
            Previous
          </button>
          <span class="text-secondary-500 px-2 text-sm">
            Page {{ meta.current_page }} of {{ meta.last_page }}
          </span>
          <button
            type="button"
            class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!meta.links?.next"
            @click="goToPage(meta.current_page + 1)"
          >
            Next
            <ChevronRightIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
      <p v-else-if="meta" class="text-secondary-500 mt-4 text-sm">{{ rangeText }}</p>
    </template>

    <BranchFormModal
      :open="!!editingBranch || isCreateOpen"
      :branch="editingBranch"
      @close="closeFormModal"
      @saved="handleSaved"
    />

    <BranchDetailModal
      :open="!!detailBranchId"
      :branch-id="detailBranchId"
      @close="detailBranchId = null"
    />
  </div>
</template>
