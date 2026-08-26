<script setup>
import { ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { MapPinIcon, PhoneIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ArrowPathIcon } from '@heroicons/vue/20/solid'
import { getStaffMember } from '@/api/staff'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  staffId: { type: Number, default: null },
})

const emit = defineEmits(['close'])

const ROLE_COLORS = {
  admin: 'bg-danger-100 text-danger-700',
  manager: 'bg-info-100 text-info-700',
  cashier: 'bg-warning-100 text-warning-700',
  kitchen: 'bg-success-100 text-success-700',
}

const member = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.staffId) {
      fetchMember(props.staffId)
    }
  },
  { immediate: true },
)

function initials(name) {
  return (name ?? '?')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function fetchMember(id) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getStaffMember(id)
    member.value = data.data
  } catch {
    errorMessage.value = 'Failed to load staff details. Please try again.'
    member.value = null
  } finally {
    isLoading.value = false
  }
}

function handleRetry() {
  if (props.staffId) {
    fetchMember(props.staffId)
  }
}
</script>

<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" class="relative z-50" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="bg-secondary-900/50 fixed inset-0" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="scale-95 opacity-0"
            enter-to="scale-100 opacity-100"
            leave="duration-200 ease-in"
            leave-from="scale-100 opacity-100"
            leave-to="scale-95 opacity-0"
          >
            <DialogPanel class="w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div class="flex items-start justify-between gap-4 p-6 pb-0">
                <div v-if="isLoading" class="flex min-w-0 items-center gap-3">
                  <BaseSkeleton class="h-10 w-10 shrink-0 rounded-full" />
                  <div class="space-y-2">
                    <BaseSkeleton class="h-5 w-36" />
                    <BaseSkeleton class="h-3 w-48" />
                  </div>
                </div>
                <div v-else-if="member" class="flex min-w-0 items-center gap-3">
                  <span
                    class="bg-primary-100 text-primary-700 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  >
                    {{ initials(member.name) }}
                  </span>
                  <div class="min-w-0">
                    <DialogTitle as="h3" class="text-secondary-900 truncate text-lg font-semibold">
                      {{ member.name }}
                    </DialogTitle>
                    <p class="text-secondary-500 truncate text-sm">{{ member.email }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="text-secondary-400 hover:text-secondary-600 cursor-pointer transition"
                  aria-label="Close"
                  @click="emit('close')"
                >
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>

              <div v-if="isLoading" class="space-y-5 p-6" role="status" aria-label="Loading staff details">
                <section class="space-y-2">
                  <BaseSkeleton class="h-3 w-16" />
                  <BaseSkeleton class="h-9 w-full rounded-lg" />
                </section>

                <section class="space-y-2">
                  <BaseSkeleton class="h-3 w-14" />
                  <BaseSkeleton class="h-20 w-full rounded-lg" />
                </section>

                <section class="space-y-2">
                  <BaseSkeleton class="h-3 w-20" />
                  <div class="flex gap-1.5">
                    <BaseSkeleton class="h-5 w-14 rounded-full" />
                    <BaseSkeleton class="h-5 w-14 rounded-full" />
                  </div>
                </section>
              </div>

              <div v-else-if="errorMessage" class="px-6 py-8">
                <div
                  class="border-danger-200 bg-danger-50 text-danger-700 mb-4 rounded-lg border px-4 py-3 text-sm font-medium"
                  role="alert"
                >
                  {{ errorMessage }}
                </div>
                <button
                  type="button"
                  class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold transition"
                  @click="handleRetry"
                >
                  <ArrowPathIcon class="h-4 w-4" />
                  Retry
                </button>
              </div>

              <div v-else-if="member" class="space-y-5 p-6">
                <section>
                  <h4 class="text-secondary-400 mb-2 text-xs font-semibold tracking-wide uppercase">
                    Status &amp; roles
                  </h4>
                  <div
                    class="divide-secondary-200 bg-secondary-50 grid grid-cols-2 divide-x rounded-lg"
                  >
                    <div class="px-4 py-3">
                      <p class="text-secondary-500 text-xs">Status</p>
                      <span
                        class="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        :class="
                          member.is_active
                            ? 'bg-success-100 text-success-700'
                            : 'bg-secondary-100 text-secondary-600'
                        "
                      >
                        {{ member.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                    <div class="px-4 py-3">
                      <p class="text-secondary-500 mb-1 text-xs">Roles</p>
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
                    </div>
                  </div>
                </section>

                <section>
                  <h4 class="text-secondary-400 mb-2 text-xs font-semibold tracking-wide uppercase">
                    Branch
                  </h4>
                  <div class="border-secondary-200 rounded-lg border px-4 py-3">
                    <template v-if="member.branch">
                      <p class="text-secondary-900 text-sm font-semibold">{{ member.branch.name }}</p>
                      <div class="text-secondary-600 mt-2 space-y-1.5 text-sm">
                        <p class="flex items-start gap-2">
                          <MapPinIcon class="text-secondary-400 mt-0.5 h-4 w-4 shrink-0" />
                          <span>{{ member.branch.address }}</span>
                        </p>
                        <p class="flex items-center gap-2">
                          <PhoneIcon class="text-secondary-400 h-4 w-4 shrink-0" />
                          <span>{{ member.branch.phone }}</span>
                        </p>
                      </div>
                    </template>
                    <p v-else class="text-secondary-500 text-sm">—</p>
                  </div>
                </section>

                <section>
                  <h4 class="text-secondary-400 mb-2 text-xs font-semibold tracking-wide uppercase">
                    Permissions
                  </h4>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="permission in member.permissions ?? []"
                      :key="permission"
                      class="bg-secondary-100 text-secondary-700 inline-flex items-center rounded-md px-2.5 py-1 font-mono text-xs"
                    >
                      {{ permission }}
                    </span>
                    <span v-if="!member.permissions?.length" class="text-secondary-400 text-sm">—</span>
                  </div>
                </section>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
