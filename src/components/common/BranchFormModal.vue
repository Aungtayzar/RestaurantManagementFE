<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Switch,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { createBranch, updateBranch } from '@/api/branches'

const props = defineProps({
  open: { type: Boolean, default: false },
  branch: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEditing = computed(() => !!props.branch)

const isSaving = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  address: '',
  phone: '',
  tax_rate: '',
  service_charge: '',
  is_active: true,
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    errorMessage.value = ''
    form.name = props.branch?.name ?? ''
    form.address = props.branch?.address ?? ''
    form.phone = props.branch?.phone ?? ''
    form.tax_rate = props.branch?.tax_rate ?? ''
    form.service_charge = props.branch?.service_charge ?? ''
    form.is_active = props.branch ? Boolean(props.branch.is_active) : true
  },
)

function handleClose() {
  if (isSaving.value) return
  emit('close')
}

function extractErrorMessage(error) {
  const data = error.response?.data
  const validationError = data?.errors && Object.values(data.errors)[0]
  if (Array.isArray(validationError) && validationError.length > 0) {
    return validationError[0]
  }
  return data?.message ?? 'Failed to save branch. Please try again.'
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
    errorMessage.value = 'Name, address and phone are required.'
    return
  }

  const taxRate = Number(form.tax_rate)
  const serviceCharge = Number(form.service_charge)

  if (Number.isNaN(taxRate) || taxRate < 0 || Number.isNaN(serviceCharge) || serviceCharge < 0) {
    errorMessage.value = 'Tax rate and service charge must be numbers of 0 or greater.'
    return
  }

  const payload = {
    name: form.name.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    tax_rate: taxRate,
    service_charge: serviceCharge,
    is_active: form.is_active,
  }

  isSaving.value = true

  try {
    const data = isEditing.value
      ? await updateBranch(props.branch.id, payload)
      : await createBranch(payload)
    toast.success(isEditing.value ? 'Branch updated' : 'Branch created')
    emit('saved', data.data)
  } catch (error) {
    errorMessage.value = extractErrorMessage(error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" class="relative z-50" @close="handleClose">
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
            <DialogPanel class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div class="flex items-start justify-between gap-4">
                <DialogTitle as="h3" class="text-secondary-900 text-lg font-semibold">
                  {{ isEditing ? 'Edit branch' : 'New branch' }}
                </DialogTitle>
                <button
                  type="button"
                  class="text-secondary-400 hover:text-secondary-600 cursor-pointer transition"
                  aria-label="Close"
                  :disabled="isSaving"
                  @click="handleClose"
                >
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>

              <div
                v-if="errorMessage"
                class="bg-danger-50 text-danger-700 mt-4 rounded-lg px-4 py-3 text-sm font-medium"
                role="alert"
              >
                {{ errorMessage }}
              </div>

              <form class="mt-5 space-y-4" @submit.prevent="handleSubmit">
                <div>
                  <label
                    for="branch-name"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Name
                  </label>
                  <input
                    id="branch-name"
                    v-model="form.name"
                    type="text"
                    placeholder="Branch name"
                    class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  />
                </div>

                <div>
                  <label
                    for="branch-address"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Address
                  </label>
                  <input
                    id="branch-address"
                    v-model="form.address"
                    type="text"
                    placeholder="Street address"
                    class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  />
                </div>

                <div>
                  <label
                    for="branch-phone"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Phone
                  </label>
                  <input
                    id="branch-phone"
                    v-model="form.phone"
                    type="tel"
                    placeholder="Phone number"
                    class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  />
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      for="branch-tax-rate"
                      class="text-secondary-700 mb-1.5 block text-sm font-medium"
                    >
                      Tax rate
                    </label>
                    <div class="relative">
                      <input
                        id="branch-tax-rate"
                        v-model="form.tax_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 pr-8 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                        :disabled="isSaving"
                      />
                      <span
                        class="text-secondary-400 pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm"
                      >
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      for="branch-service-charge"
                      class="text-secondary-700 mb-1.5 block text-sm font-medium"
                    >
                      Service charge
                    </label>
                    <div class="relative">
                      <input
                        id="branch-service-charge"
                        v-model="form.service_charge"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 pr-8 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                        :disabled="isSaving"
                      />
                      <span
                        class="text-secondary-400 pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm"
                      >
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div class="bg-secondary-50 flex items-center justify-between rounded-lg px-4 py-3">
                  <div>
                    <p class="text-secondary-700 text-sm font-medium">Active</p>
                    <p class="text-secondary-500 text-xs">Branch is open for business</p>
                  </div>
                  <Switch
                    v-model="form.is_active"
                    :class="form.is_active ? 'bg-success-600' : 'bg-secondary-200'"
                    class="focus:ring-primary-200 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  >
                    <span
                      class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition"
                      :class="form.is_active ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </Switch>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="isSaving"
                    @click="handleClose"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 disabled:bg-primary-400 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  >
                    {{ isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create branch' }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
