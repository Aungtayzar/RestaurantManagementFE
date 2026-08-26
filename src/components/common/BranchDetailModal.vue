<script setup>
import { ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { BuildingOffice2Icon, MapPinIcon, PhoneIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ArrowPathIcon } from '@heroicons/vue/20/solid'
import { getBranch } from '@/api/branches'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  branchId: { type: Number, default: null },
})

const emit = defineEmits(['close'])

const branch = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.branchId) {
      fetchBranch(props.branchId)
    }
  },
)

function formatPercent(value) {
  const number = Number.parseFloat(value)
  return Number.isNaN(number) ? `${value}%` : `${number}%`
}

async function fetchBranch(id) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getBranch(id)
    branch.value = data.data
  } catch {
    errorMessage.value = 'Failed to load branch details. Please try again.'
    branch.value = null
  } finally {
    isLoading.value = false
  }
}

function handleRetry() {
  if (props.branchId) {
    fetchBranch(props.branchId)
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
                <div v-if="isLoading" class="flex items-center gap-3">
                  <BaseSkeleton class="h-10 w-10 rounded-lg" />
                  <div class="space-y-2">
                    <BaseSkeleton class="h-5 w-36" />
                    <BaseSkeleton class="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <div v-else-if="branch" class="flex min-w-0 items-center gap-3">
                  <div class="bg-primary-100 text-primary-600 rounded-lg p-2">
                    <BuildingOffice2Icon class="h-6 w-6" />
                  </div>
                  <div class="min-w-0">
                    <DialogTitle as="h3" class="text-secondary-900 truncate text-lg font-semibold">
                      {{ branch.name }}
                    </DialogTitle>
                    <span
                      class="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      :class="
                        branch.is_active
                          ? 'bg-success-100 text-success-700'
                          : 'bg-secondary-100 text-secondary-600'
                      "
                    >
                      {{ branch.is_active ? 'Active' : 'Inactive' }}
                    </span>
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

              <div
                v-if="isLoading"
                class="space-y-5 p-6"
                role="status"
                aria-label="Loading branch details"
              >
                <section class="space-y-2">
                  <BaseSkeleton class="h-3 w-16" />
                  <div class="space-y-2.5">
                    <div class="flex items-center gap-2">
                      <BaseSkeleton class="h-4 w-4 shrink-0 rounded-full" />
                      <BaseSkeleton class="h-3 w-2/3" />
                    </div>
                    <div class="flex items-center gap-2">
                      <BaseSkeleton class="h-4 w-4 shrink-0 rounded-full" />
                      <BaseSkeleton class="h-3 w-1/2" />
                    </div>
                  </div>
                </section>

                <section class="space-y-2">
                  <BaseSkeleton class="h-3 w-14" />
                  <div
                    class="divide-secondary-200 bg-secondary-50 grid grid-cols-2 divide-x rounded-lg"
                  >
                    <div class="space-y-1.5 px-4 py-3">
                      <BaseSkeleton class="h-3 w-14" />
                      <BaseSkeleton class="h-4 w-10" />
                    </div>
                    <div class="space-y-1.5 px-4 py-3">
                      <BaseSkeleton class="h-3 w-20" />
                      <BaseSkeleton class="h-4 w-10" />
                    </div>
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

              <div v-else-if="branch" class="space-y-5 p-6">
                <section>
                  <h4 class="text-secondary-400 mb-2 text-xs font-semibold tracking-wide uppercase">
                    Overview
                  </h4>
                  <div class="text-secondary-600 space-y-2 text-sm">
                    <p class="flex items-start gap-2">
                      <MapPinIcon class="text-secondary-400 mt-0.5 h-4 w-4 shrink-0" />
                      <span>{{ branch.address }}</span>
                    </p>
                    <p class="flex items-center gap-2">
                      <PhoneIcon class="text-secondary-400 h-4 w-4 shrink-0" />
                      <span>{{ branch.phone }}</span>
                    </p>
                  </div>
                </section>

                <section>
                  <h4 class="text-secondary-400 mb-2 text-xs font-semibold tracking-wide uppercase">
                    Charges
                  </h4>
                  <div
                    class="divide-secondary-200 bg-secondary-50 grid grid-cols-2 divide-x rounded-lg"
                  >
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
                </section>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
