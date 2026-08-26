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
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { createStaff, updateStaff } from '@/api/staff'

const props = defineProps({
  open: { type: Boolean, default: false },
  branches: { type: Array, default: () => [] },
  staff: { type: Object, default: null },
  selfId: { type: [Number, String], default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEditing = computed(() => !!props.staff)

const isSelfEdit = computed(
  () => isEditing.value && props.staff?.id != null && props.staff.id === props.selfId,
)

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'kitchen', label: 'Kitchen' },
]

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

const isSaving = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: '',
  branch_id: '',
  is_active: true,
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    errorMessage.value = ''
    showPassword.value = false
    form.name = props.staff?.name ?? ''
    form.email = props.staff?.email ?? ''
    form.password = ''
    form.role = props.staff?.roles?.[0] ?? ''
    form.branch_id = String(props.staff?.branch_id ?? props.staff?.branch?.id ?? '')
    form.is_active = props.staff ? Boolean(props.staff.is_active) : true
  },
  { immediate: true },
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
  return data?.message ?? 'Failed to save staff. Please try again.'
}

function validate() {
  if (!form.name.trim()) {
    return 'Name is required.'
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    return 'A valid email address is required.'
  }
  if (!isEditing.value || form.password) {
    if (form.password.length < 8) {
      return 'Password must be at least 8 characters.'
    }
  }
  if (!isSelfEdit.value) {
    if (!form.role) {
      return 'Role is required.'
    }
    if (!form.branch_id) {
      return 'Branch is required.'
    }
  }
  return ''
}

async function handleSubmit() {
  errorMessage.value = ''

  const validationMessage = validate()
  if (validationMessage) {
    errorMessage.value = validationMessage
    return
  }

  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
  }

  if (!isSelfEdit.value) {
    payload.role = form.role
    payload.branch_id = Number(form.branch_id)
    payload.is_active = form.is_active
  }

  if (form.password) {
    payload.password = form.password
  }

  isSaving.value = true

  try {
    if (isEditing.value) {
      await updateStaff(props.staff.id, payload)
      toast.success('Staff account updated successfully')
    } else {
      await createStaff(payload)
      toast.success('Staff account created successfully')
    }
    emit('saved')
    emit('close')
  } catch (error) {
    toast.error(extractErrorMessage(error))
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
                <div>
                  <DialogTitle as="h3" class="text-secondary-900 text-lg font-semibold">
                    {{ isEditing ? 'Edit staff' : 'New staff' }}
                  </DialogTitle>
                  <p class="text-secondary-500 mt-1 text-sm">
                    {{ isEditing ? 'Update this staff account' : 'Create a new staff account' }}
                  </p>
                </div>
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
                    for="staff-name"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Name <span class="text-danger-500">*</span>
                  </label>
                  <input
                    id="staff-name"
                    v-model="form.name"
                    type="text"
                    required
                    placeholder="Full name"
                    autocomplete="off"
                    class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  />
                </div>

                <div>
                  <label
                    for="staff-email"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Email <span class="text-danger-500">*</span>
                  </label>
                  <input
                    id="staff-email"
                    v-model="form.email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    autocomplete="off"
                    class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  />
                </div>

                <div>
                  <label
                    for="staff-password"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Password <span v-if="!isEditing" class="text-danger-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      id="staff-password"
                      v-model="form.password"
                      :type="showPassword ? 'text' : 'password'"
                      :required="!isEditing"
                      minlength="8"
                      :placeholder="
                        isEditing ? 'Leave blank to keep current password' : 'At least 8 characters'
                      "
                      autocomplete="new-password"
                      class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                      :disabled="isSaving"
                    />
                    <button
                      type="button"
                      class="text-secondary-400 hover:text-secondary-600 absolute top-1/2 right-3 -translate-y-1/2 transition"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      :disabled="isSaving"
                      @click="showPassword = !showPassword"
                    >
                      <EyeSlashIcon v-if="showPassword" class="h-5 w-5" />
                      <EyeIcon v-else class="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      for="staff-role"
                      class="text-secondary-700 mb-1.5 block text-sm font-medium"
                    >
                      Role <span class="text-danger-500">*</span>
                    </label>
                    <select
                      id="staff-role"
                      v-model="form.role"
                      required
                      class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                      :disabled="isSaving || isSelfEdit"
                    >
                      <option value="" disabled>Select a role</option>
                      <option
                        v-for="option in ROLE_OPTIONS"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <p v-if="isSelfEdit" class="text-secondary-500 mt-1 text-xs">
                      Your own role cannot be changed.
                    </p>
                  </div>

                  <div>
                    <label
                      for="staff-branch"
                      class="text-secondary-700 mb-1.5 block text-sm font-medium"
                    >
                      Branch <span class="text-danger-500">*</span>
                    </label>
                    <select
                      id="staff-branch"
                      v-model="form.branch_id"
                      required
                      class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                      :disabled="isSaving || isSelfEdit"
                    >
                      <option value="" disabled>Select a branch</option>
                      <option
                        v-for="branch in branches"
                        :key="branch.id"
                        :value="String(branch.id)"
                      >
                        {{ branch.name }}
                      </option>
                    </select>
                    <p v-if="isSelfEdit" class="text-secondary-500 mt-1 text-xs">
                      Your own branch cannot be changed.
                    </p>
                  </div>
                </div>

                <div class="bg-secondary-50 flex items-center justify-between rounded-lg px-4 py-3">
                  <div>
                    <p class="text-secondary-700 text-sm font-medium">Active</p>
                    <p class="text-secondary-500 text-xs">Account can sign in immediately</p>
                  </div>
                  <Switch
                    v-model="form.is_active"
                    :class="form.is_active ? 'bg-success-600' : 'bg-secondary-200'"
                    class="focus:ring-primary-200 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving || isSelfEdit"
                  >
                    <span
                      class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition"
                      :class="form.is_active ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </Switch>
                </div>
                <p v-if="isSelfEdit" class="text-secondary-500 text-xs">
                  Your own status cannot be changed.
                </p>

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
                    {{
                      isSaving
                        ? isEditing
                          ? 'Saving…'
                          : 'Creating…'
                        : isEditing
                          ? 'Save changes'
                          : 'Create staff'
                    }}
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
