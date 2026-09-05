<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth'
import { getBranches } from '@/api/branches'
import { deleteTable, getTables } from '@/api/tables'
import TableFormModal from '@/components/tables/TableFormModal.vue'
import TableStatus from '@/components/tables/TableStatus.vue'
import TableActions from '@/components/tables/TableActions.vue'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal.vue'
import { tableError } from '@/components/tables/tableErrors'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.roles?.includes('admin'))
const canManage = computed(() =>
  auth.user?.roles?.some((role) => ['admin', 'manager'].includes(role)),
)
const storageKey = `tables:${auth.user?.id ?? 'guest'}`
function readPreference(key) {
  try {
    return sessionStorage.getItem(`${storageKey}:${key}`)
  } catch {
    return null
  }
}
function remember(key, value) {
  try {
    sessionStorage.setItem(`${storageKey}:${key}`, value)
  } catch {
    /* Storage is optional. */
  }
}
const layout = ref(readPreference('layout') === 'grid' ? 'grid' : 'list')
const selectedBranch = ref('')
const branches = ref([])
const branchLoading = ref(false)
const branchError = ref('')
const tables = ref([])
const summary = ref(null)
const loading = ref(false)
const error = ref('')
const search = ref('')
const occupancy = ref('')
const activity = ref('')
const formOpen = ref(false)
const editing = ref(null)
const pendingDelete = ref(null)
const deleting = ref(false)
const updatedAt = ref('')
let requestId = 0
let disposed = false
const branch = computed(() =>
  branches.value.find((item) => String(item.id) === selectedBranch.value),
)
const hasBranch = computed(() => !isAdmin.value || Boolean(branch.value))
const branchName = computed(() =>
  isAdmin.value
    ? (branch.value?.name ?? '')
    : (auth.user?.branch?.name ?? auth.user?.branch_name ?? 'Your assigned branch'),
)
const canCreate = computed(
  () => canManage.value && hasBranch.value && (!isAdmin.value || branch.value?.is_active !== false),
)
const filtered = computed(() =>
  tables.value.filter(
    (table) =>
      table.name.toLowerCase().includes(search.value.trim().toLowerCase()) &&
      (!occupancy.value || (table.is_active && table.status === occupancy.value)) &&
      (!activity.value || table.is_active === (activity.value === 'active')),
  ),
)
const hasFilters = computed(() => Boolean(search.value || occupancy.value || activity.value))
function clearFilters() {
  search.value = ''
  occupancy.value = ''
  activity.value = ''
}

async function loadTables() {
  const id = ++requestId
  if (!hasBranch.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const result = await getTables({
      branch_id: isAdmin.value ? Number(selectedBranch.value) : undefined,
      include_inactive: canManage.value,
    })
    if (disposed || id !== requestId) return
    tables.value = result.data ?? []
    summary.value = result.summary ?? null
    updatedAt.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (cause) {
    if (disposed || id !== requestId) return
    tables.value = []
    summary.value = null
    error.value = tableError(cause, 'Could not load tables. Please try again.')
  } finally {
    if (!disposed && id === requestId) loading.value = false
  }
}

async function loadBranches() {
  branchLoading.value = true
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
    const saved = readPreference('branch')
    if (all.some((item) => String(item.id) === saved)) selectedBranch.value = saved
  } catch (cause) {
    if (!disposed)
      branchError.value = tableError(cause, 'Could not load branches. Please try again.')
  } finally {
    if (!disposed) branchLoading.value = false
  }
}

watch(selectedBranch, () => {
  remember('branch', selectedBranch.value)
  tables.value = []
  summary.value = null
  updatedAt.value = ''
  error.value = ''
  clearFilters()
  loadTables()
})
watch(layout, (value) => remember('layout', value))
onMounted(() => (isAdmin.value ? loadBranches() : loadTables()))
onUnmounted(() => {
  disposed = true
  requestId++
})
function openForm(table = null) {
  editing.value = table
  formOpen.value = true
}
function saved() {
  toast.success(editing.value ? 'Table updated' : 'Table added')
  formOpen.value = false
  loadTables()
}
async function confirmDelete() {
  if (deleting.value || !pendingDelete.value) return
  deleting.value = true
  try {
    await deleteTable(pendingDelete.value.id)
    pendingDelete.value = null
    toast.success('Table deleted')
    await loadTables()
  } catch (cause) {
    toast.error(tableError(cause, 'Could not delete the table. Please try again.'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section class="tables-page mx-auto max-w-7xl space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-secondary-900 text-2xl font-semibold tracking-tight">Tables</h1>
        <p class="text-secondary-500 mt-1 text-sm">
          {{
            canManage
              ? 'Manage your seating and keep table details up to date.'
              : 'View your branch’s tables and availability.'
          }}
        </p>
      </div>
      <button
        v-if="canManage"
        type="button"
        class="primary-button"
        :disabled="!canCreate"
        @click="openForm()"
      >
        <PlusIcon class="size-4" />Add table
      </button>
    </header>

    <div
      class="border-secondary-200 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <BuildingStorefrontIcon class="text-secondary-400 size-5 shrink-0" />
        <div v-if="isAdmin" class="w-full sm:max-w-xs">
          <label for="tables-branch" class="text-secondary-500 mb-1 block text-xs font-medium"
            >Branch</label
          >
          <select
            id="tables-branch"
            v-model="selectedBranch"
            class="control w-full"
            :disabled="branchLoading || formOpen || deleting"
          >
            <option value="">{{ branchLoading ? 'Loading branches…' : 'Select a branch' }}</option>
            <option v-for="item in branches" :key="item.id" :value="String(item.id)">
              {{ item.name }}{{ item.is_active === false ? ' (inactive)' : '' }}
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
        <button type="button" class="secondary-button" :disabled="loading" @click="loadTables">
          <ArrowPathIcon class="size-4" :class="{ 'animate-spin': loading }" />Refresh
        </button>
      </div>
    </div>

    <div
      v-if="branchError"
      role="alert"
      class="bg-danger-50 text-danger-700 rounded-lg p-4 text-sm"
    >
      {{ branchError }}
      <button class="ml-2 font-semibold underline" @click="loadBranches">Retry</button>
    </div>
    <div
      v-else-if="!hasBranch"
      class="border-secondary-300 rounded-xl border border-dashed px-6 py-20 text-center"
    >
      <BuildingStorefrontIcon class="text-secondary-400 mx-auto size-9" />
      <h2 class="text-secondary-900 mt-4 font-semibold">
        {{
          branchLoading
            ? 'Loading branches'
            : branches.length
              ? 'Choose a branch to get started'
              : 'No branches available'
        }}
      </h2>
      <p class="text-secondary-500 mt-2 text-sm">
        {{
          branches.length
            ? 'View and manage the tables for one location at a time.'
            : 'Tables belong to a branch. A branch must be available first.'
        }}
      </p>
    </div>

    <template v-if="hasBranch">
      <p
        v-if="isAdmin && branch?.is_active === false"
        class="bg-warning-50 text-warning-800 rounded-lg p-3 text-sm"
      >
        This branch is inactive. New tables cannot be added.
      </p>
      <div
        v-if="summary && !loading"
        class="flex flex-wrap gap-x-8 gap-y-3 px-1 text-sm"
        aria-label="Table summary"
      >
        <span class="text-secondary-500"
          ><strong class="text-secondary-900 mr-1 text-lg font-semibold tabular-nums">{{
            tables.length
          }}</strong>
          tables</span
        >
        <span class="text-secondary-500"
          ><strong class="text-success-700 mr-1 text-lg font-semibold tabular-nums">{{
            summary.available
          }}</strong>
          available</span
        >
        <span class="text-secondary-500"
          ><strong class="text-warning-700 mr-1 text-lg font-semibold tabular-nums">{{
            summary.occupied
          }}</strong>
          occupied</span
        >
        <span v-if="canManage" class="text-secondary-500"
          ><strong class="text-secondary-700 mr-1 text-lg font-semibold tabular-nums">{{
            tables.filter((table) => !table.is_active).length
          }}</strong>
          inactive</span
        >
      </div>

      <div class="space-y-4">
        <div class="flex flex-wrap items-end gap-3">
          <div class="min-w-44 flex-1">
            <label for="tables-search" class="filter-label">Search tables</label>
            <div class="relative">
              <MagnifyingGlassIcon
                class="text-secondary-400 pointer-events-none absolute top-3 left-3 size-4"
              /><input
                id="tables-search"
                v-model="search"
                class="control w-full pl-9"
                placeholder="Search by name…"
                type="search"
              />
            </div>
          </div>
          <div>
            <label for="tables-occupancy" class="filter-label">Occupancy</label
            ><select id="tables-occupancy" v-model="occupancy" class="control">
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
          <div v-if="canManage">
            <label for="tables-activity" class="filter-label">In service</label
            ><select id="tables-activity" v-model="activity" class="control">
              <option value="">Active & inactive</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
          <div
            class="border-secondary-200 bg-secondary-100 flex rounded-lg border p-1"
            role="group"
            aria-label="Table layout"
          >
            <button
              v-for="mode in ['list', 'grid']"
              :key="mode"
              type="button"
              :aria-pressed="layout === mode"
              class="flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium capitalize"
              :class="
                layout === mode
                  ? 'text-secondary-900 bg-white shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-900'
              "
              @click="layout = mode"
            >
              <component :is="mode === 'list' ? ListBulletIcon : Squares2X2Icon" class="size-4" />{{
                mode
              }}
            </button>
          </div>
        </div>
        <div
          v-if="error"
          role="alert"
          class="border-danger-200 bg-danger-50 text-danger-700 rounded-lg border p-4 text-sm"
        >
          {{ error }}
          <button type="button" class="ml-2 font-semibold underline" @click="loadTables">
            Retry
          </button>
        </div>
        <div
          v-else-if="loading"
          role="status"
          class="border-secondary-200 rounded-xl border bg-white p-6"
        >
          <p class="text-secondary-500 text-sm">Loading tables…</p>
          <div
            v-for="n in 4"
            :key="n"
            class="bg-secondary-100 mt-5 h-10 animate-pulse rounded-lg"
          />
        </div>
        <div
          v-else-if="!filtered.length"
          class="border-secondary-200 rounded-xl border bg-white px-6 py-16 text-center"
        >
          <TableCellsIcon class="text-secondary-300 mx-auto size-9" />
          <h2 class="text-secondary-900 mt-4 font-semibold">
            {{ hasFilters ? 'No matching tables' : 'No tables yet' }}
          </h2>
          <p class="text-secondary-500 mt-2 text-sm">
            {{
              hasFilters
                ? 'Try a different name or clear your filters.'
                : canManage
                  ? 'Add your first table to start organizing this branch’s seating.'
                  : 'Tables will appear here once they are set up.'
            }}
          </p>
          <button v-if="hasFilters" class="secondary-button mx-auto mt-5" @click="clearFilters">
            Clear filters
          </button>
          <button v-else-if="canCreate" class="primary-button mx-auto mt-5" @click="openForm()">
            Add your first table
          </button>
        </div>
        <template v-else>
          <div
            class="text-secondary-500 flex items-center justify-between text-xs"
            aria-live="polite"
          >
            <span
              >{{ filtered.length }} of {{ tables.length }} tables
              <button
                v-if="hasFilters"
                class="text-primary-700 ml-2 font-medium underline"
                @click="clearFilters"
              >
                Clear filters
              </button></span
            ><span>Sorted by display order</span>
          </div>
          <div
            v-if="layout === 'list'"
            class="border-secondary-200 overflow-x-auto rounded-xl border bg-white"
          >
            <table class="w-full text-left text-sm">
              <caption class="sr-only">
                Tables for
                {{
                  branchName
                }}
              </caption>
              <thead
                class="border-secondary-200 bg-secondary-50 text-secondary-500 border-b text-xs"
              >
                <tr>
                  <th scope="col" class="px-5 py-3 font-medium">Table</th>
                  <th scope="col" class="px-4 py-3 font-medium">Seats</th>
                  <th scope="col" class="px-4 py-3 font-medium">Status</th>
                  <th scope="col" class="px-4 py-3 font-medium">Display Order</th>
                  <th v-if="canManage" scope="col" class="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-secondary-100 divide-y">
                <tr v-for="table in filtered" :key="table.id" class="hover:bg-secondary-50/70">
                  <th
                    scope="row"
                    class="text-secondary-900 max-w-xs min-w-40 px-5 py-4 font-medium break-words"
                  >
                    {{ table.name }}
                  </th>
                  <td class="text-secondary-600 px-4 py-4 tabular-nums">{{ table.capacity }}</td>
                  <td class="px-4 py-4 whitespace-nowrap"><TableStatus :table="table" /></td>
                  <td class="text-secondary-500 px-4 py-4 tabular-nums">
                    {{ table.display_order }}
                  </td>
                  <td v-if="canManage" class="px-3 py-2">
                    <TableActions
                      :table="table"
                      @edit="openForm"
                      @delete="pendingDelete = $event"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-else
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Table cards"
          >
            <article
              v-for="table in filtered"
              :key="table.id"
              class="overflow-hidden rounded-xl border bg-white shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none"
              :class="
                !table.is_active
                  ? 'border-secondary-200'
                  : table.status === 'available'
                    ? 'border-success-200'
                    : table.status === 'occupied'
                      ? 'border-warning-200'
                      : 'border-secondary-200'
              "
            >
              <div class="flex items-start justify-between gap-3 p-5 pb-0">
                <TableStatus :table="table" /><span
                  class="text-secondary-400 pt-1 text-xs tabular-nums"
                  >Order {{ table.display_order }}</span
                >
              </div>
              <div class="flex items-center gap-4 p-5">
                <div
                  class="flex size-14 shrink-0 items-center justify-center rounded-xl border"
                  :class="
                    !table.is_active
                      ? 'border-secondary-200 bg-secondary-50 text-secondary-400'
                      : table.status === 'available'
                        ? 'border-success-200 bg-success-50 text-success-600'
                        : table.status === 'occupied'
                          ? 'border-warning-200 bg-warning-50 text-warning-600'
                          : 'border-secondary-200 bg-secondary-50 text-secondary-400'
                  "
                >
                  <TableCellsIcon class="size-7" />
                </div>
                <div class="min-w-0">
                  <h2 class="text-secondary-900 text-lg font-semibold wrap-break-word">
                    {{ table.name }}
                  </h2>
                  <p class="text-secondary-500 mt-1 flex items-center gap-1.5 text-sm">
                    <UsersIcon class="size-4" />{{ table.capacity }}
                    {{ table.capacity === 1 ? 'seat' : 'seats' }}
                  </p>
                </div>
              </div>
              <div
                v-if="canManage"
                class="border-secondary-100 flex items-center justify-between border-t px-4 py-1.5"
              >
                <span class="text-secondary-500 text-xs">{{
                  table.is_active ? 'In service' : 'Out of service'
                }}</span>
                <TableActions :table="table" @edit="openForm" @delete="pendingDelete = $event" />
              </div>
            </article>
          </div>
        </template>
      </div>
    </template>
    <TableFormModal
      v-if="formOpen"
      :table="editing"
      :branch-id="isAdmin ? selectedBranch : null"
      :branch-name="branchName"
      @close="formOpen = false"
      @saved="saved"
    />
    <DeleteConfirmationModal
      :open="!!pendingDelete"
      :item-name="pendingDelete?.name ?? ''"
      message="This permanently removes the table. To temporarily take it out of service, edit it and turn off Active table instead."
      :loading="deleting"
      @close="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<style scoped>
@reference '../../assets/main.css';
.control {
  @apply border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 min-h-10 rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:opacity-50;
}
.control.pl-9 {
  @apply pl-9;
}
.filter-label {
  @apply text-secondary-500 mb-1.5 block text-xs font-medium;
}
.primary-button {
  @apply bg-primary-600 hover:bg-primary-700 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40;
}
.secondary-button {
  @apply border-secondary-300 text-secondary-700 hover:bg-secondary-50 flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium disabled:opacity-50;
}
.tables-page button:focus-visible {
  @apply outline-primary-600 outline-2 outline-offset-2;
}
</style>
