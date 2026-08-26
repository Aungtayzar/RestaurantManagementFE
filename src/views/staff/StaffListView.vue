<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/vue/20/solid'
import { getStaff } from '@/api/staff'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import StaffFormModal from '@/components/common/StaffFormModal.vue'
import StaffDetailModal from '@/components/common/StaffDetailModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'kitchen', label: 'Kitchen' },
]

const ROLE_COLORS = {
  admin: 'bg-danger-100 text-danger-700',
  manager: 'bg-info-100 text-info-700',
  cashier: 'bg-warning-100 text-warning-700',
  kitchen: 'bg-success-100 text-success-700',
}

const staff = ref([])
const meta = ref(null)
const branches = ref([])
const isLoading = ref(false)
const error = ref(null)
const isCreateOpen = ref(false)
const editingStaff = ref(null)
const detailStaffId = ref(null)

const isAdmin = computed(() => auth.user?.roles?.includes('admin') ?? false)

const search = ref('')
const debouncedSearch = ref('')
const selectedRole = ref('')
const selectedBranch = ref('')

let searchTimeout

const currentPage = computed(() => Number(route.query.page) || 1)

const rangeText = computed(() => {
  if (!meta.value || meta.value.total === 0) return ''
  return `Showing ${meta.value.from}–${meta.value.to} of ${meta.value.total} staff`
})

function initials(name) {
  return (name ?? '?')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function fetchStaff() {
  isLoading.value = true
  error.value = null

  try {
    const data = await getStaff({
      page: currentPage.value,
      search: debouncedSearch.value || undefined,
      role: selectedRole.value || undefined,
      branch_id: selectedBranch.value || undefined,
    })
    staff.value = data.data
    meta.value = data.meta ?? null
  } catch {
    error.value = 'Failed to load staff. Please try again.'
    staff.value = []
    meta.value = null
  } finally {
    isLoading.value = false
  }
}

async function fetchBranchOptions() {
  try {
    const data = await getBranches({ page: 1 })
    branches.value = data.data
  } catch {
    branches.value = []
  }
}

function goToPage(page) {
  if (!page || page === currentPage.value) return
  router.push({ query: { ...route.query, page } })
}

function resetToFirstPage() {
  if (currentPage.value !== 1) {
    router.push({ query: { ...route.query, page: 1 } })
    return
  }
  fetchStaff()
}

function closeFormModal() {
  isCreateOpen.value = false
  editingStaff.value = null
}

function handleSaved() {
  const wasCreate = isCreateOpen.value
  closeFormModal()

  if (wasCreate) {
    resetToFirstPage()
    return
  }
  fetchStaff()
}

watch(search, (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = value.trim()
  }, 300)
})

watch([debouncedSearch, selectedRole, selectedBranch], () => {
  resetToFirstPage()
})

watch(
  () => currentPage.value,
  () => fetchStaff(),
  { immediate: true },
)

fetchBranchOptions()

onUnmounted(() => clearTimeout(searchTimeout))
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-secondary-900 text-2xl font-bold">Staff</h1>
        <p class="text-secondary-500 mt-1 text-sm">Manage your restaurant staff accounts</p>
      </div>
      <button
        v-if="isAdmin"
        type="button"
        class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none"
        @click="isCreateOpen = true"
      >
        <PlusIcon class="h-4 w-4" />
        Add New
      </button>
    </div>

    <div
      class="border-secondary-200 mb-5 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
    >
      <div class="relative w-full sm:max-w-xs">
        <MagnifyingGlassIcon
          class="text-secondary-400 pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
        />
        <label for="staff-search" class="sr-only">Search staff</label>
        <input
          id="staff-search"
          v-model="search"
          type="search"
          placeholder="Search by name or email"
          class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 block w-full rounded-lg border py-2.5 pr-3.5 pl-10 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      <div class="w-full sm:w-auto">
        <label for="staff-role-filter" class="sr-only">Filter by role</label>
        <select
          id="staff-role-filter"
          v-model="selectedRole"
          class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="">All roles</option>
          <option v-for="option in ROLE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div v-if="isAdmin" class="w-full sm:w-auto">
        <label for="staff-branch-filter" class="sr-only">Filter by branch</label>
        <select
          id="staff-branch-filter"
          v-model="selectedBranch"
          class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="">All branches</option>
          <option v-for="branch in branches" :key="branch.id" :value="String(branch.id)">
            {{ branch.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" role="status" aria-label="Loading staff">
      <div class="grid grid-cols-1 gap-4 md:hidden">
        <div
          v-for="n in 6"
          :key="n"
          class="border-secondary-200 rounded-xl border bg-white p-4 shadow-sm"
        >
          <div class="mb-3 flex items-center gap-3">
            <BaseSkeleton class="h-10 w-10 shrink-0 rounded-full" />
            <div class="min-w-0 flex-1 space-y-1.5">
              <BaseSkeleton class="h-4 w-28" />
              <BaseSkeleton class="h-3 w-40" />
            </div>
            <BaseSkeleton class="h-5 w-16 rounded-full" />
          </div>
          <div class="mb-3 flex gap-1.5">
            <BaseSkeleton class="h-5 w-14 rounded-full" />
            <BaseSkeleton class="h-5 w-14 rounded-full" />
          </div>
          <BaseSkeleton class="mb-4 h-3 w-20" />
          <div class="flex gap-2">
            <BaseSkeleton class="h-9 flex-1 rounded-lg" />
            <BaseSkeleton class="h-9 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
      <div
        class="border-secondary-200 hidden overflow-hidden rounded-xl border bg-white shadow-sm md:block"
      >
        <div class="divide-secondary-200 divide-y">
          <div v-for="n in 6" :key="n" class="flex items-center gap-4 px-6 py-4">
            <BaseSkeleton class="h-9 w-9 shrink-0 rounded-full" />
            <BaseSkeleton class="h-4 w-32" />
            <BaseSkeleton class="h-4 w-48" />
            <BaseSkeleton class="ml-auto h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="border-danger-200 bg-danger-50 text-danger-700 rounded-lg border px-4 py-3 text-sm"
    >
      {{ error }}
    </div>

    <p
      v-else-if="staff.length === 0"
      class="text-secondary-500 border-secondary-200 rounded-xl border bg-white py-24 text-center text-sm shadow-sm"
    >
      No staff found.
    </p>

    <template v-else>
      <div class="grid grid-cols-1 gap-4 md:hidden">
        <article
          v-for="member in staff"
          :key="member.id"
          class="border-secondary-200 rounded-xl border bg-white p-4 shadow-sm"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="bg-primary-100 text-primary-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              >
                {{ initials(member.name) }}
              </span>
              <div class="min-w-0">
                <p class="text-secondary-900 truncate text-sm font-semibold">{{ member.name }}</p>
                <p class="text-secondary-500 truncate text-xs">{{ member.email }}</p>
              </div>
            </div>
            <span
              class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="
                member.is_active
                  ? 'bg-success-100 text-success-700'
                  : 'bg-secondary-100 text-secondary-600'
              "
            >
              {{ member.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="mb-3 flex flex-wrap gap-1.5">
            <span
              v-for="role in member.roles ?? []"
              :key="role"
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
              :class="ROLE_COLORS[role] ?? 'bg-secondary-100 text-secondary-700'"
            >
              {{ role }}
            </span>
            <span v-if="!member.roles?.length" class="text-secondary-400 text-xs">—</span>
          </div>

          <p class="text-secondary-600 mb-4 text-xs">
            {{ member.branch?.name ?? 'No branch' }}
          </p>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 focus:ring-primary-200 inline-flex flex-1 items-center justify-center rounded-lg border bg-white px-3 py-2 text-xs font-semibold transition focus:ring-2 focus:outline-none"
              @click="detailStaffId = member.id"
            >
              Details
            </button>
            <button
              v-if="isAdmin"
              type="button"
              class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 focus:ring-primary-200 inline-flex flex-1 items-center justify-center gap-1 rounded-lg border bg-white px-3 py-2 text-xs font-semibold transition focus:ring-2 focus:outline-none"
              @click="editingStaff = member"
            >
              <PencilSquareIcon class="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </article>
      </div>

      <div
        class="border-secondary-200 hidden overflow-hidden rounded-xl border bg-white shadow-sm md:block"
      >
        <div class="overflow-x-auto">
          <table class="divide-secondary-200 min-w-full divide-y">
            <thead class="bg-secondary-50">
              <tr>
                <th
                  scope="col"
                  class="text-secondary-500 px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Name
                </th>
                <th
                  scope="col"
                  class="text-secondary-500 px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Email
                </th>
                <th
                  scope="col"
                  class="text-secondary-500 px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Roles
                </th>
                <th
                  scope="col"
                  class="text-secondary-500 px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Branch
                </th>
                <th
                  scope="col"
                  class="text-secondary-500 px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Status
                </th>
                <th scope="col">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-secondary-200 divide-y bg-white">
              <tr
                v-for="member in staff"
                :key="member.id"
                class="hover:bg-secondary-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <span
                      class="bg-primary-100 text-primary-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    >
                      {{ initials(member.name) }}
                    </span>
                    <p class="text-secondary-900 text-sm font-medium">{{ member.name }}</p>
                  </div>
                </td>
                <td class="text-secondary-600 px-6 py-4 text-sm whitespace-nowrap">
                  {{ member.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="role in member.roles ?? []"
                      :key="role"
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                      :class="ROLE_COLORS[role] ?? 'bg-secondary-100 text-secondary-700'"
                    >
                      {{ role }}
                    </span>
                    <span v-if="!member.roles?.length" class="text-secondary-400 text-sm">—</span>
                  </div>
                </td>
                <td class="text-secondary-600 px-6 py-4 text-sm whitespace-nowrap">
                  {{ member.branch?.name ?? '—' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="
                      member.is_active
                        ? 'bg-success-100 text-success-700'
                        : 'bg-secondary-100 text-secondary-600'
                    "
                  >
                    {{ member.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 focus:ring-primary-200 inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition focus:ring-2 focus:outline-none"
                      @click="detailStaffId = member.id"
                    >
                      Details
                    </button>
                    <button
                      v-if="isAdmin"
                      type="button"
                      class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 focus:ring-primary-200 inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition focus:ring-2 focus:outline-none"
                      @click="editingStaff = member"
                    >
                      <PencilSquareIcon class="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="meta && meta.last_page > 1"
        class="border-secondary-200 mt-6 flex flex-col items-center gap-3 border-t pt-4 sm:flex-row sm:justify-between"
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

    <StaffFormModal
      :open="!!editingStaff || isCreateOpen"
      :branches="branches"
      :staff="editingStaff"
      :self-id="auth.user?.id ?? null"
      @close="closeFormModal"
      @saved="handleSaved"
    />

    <StaffDetailModal
      :open="!!detailStaffId"
      :staff-id="detailStaffId"
      @close="detailStaffId = null"
    />
  </div>
</template>
