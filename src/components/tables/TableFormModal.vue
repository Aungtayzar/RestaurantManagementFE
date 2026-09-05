<script setup>
import { computed, ref } from 'vue'
import { Dialog, DialogPanel, DialogTitle, Switch } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { createTable, updateTable } from '@/api/tables'
import { tableError } from './tableErrors'

const props = defineProps({
  table: { type: Object, default: null },
  branchId: { type: [Number, String], default: null },
  branchName: { type: String, required: true },
})
const emit = defineEmits(['close', 'saved'])
const editing = computed(() => Boolean(props.table))
const name = ref(props.table?.name ?? '')
const capacity = ref(props.table?.capacity ?? 1)
const displayOrder = ref(props.table?.display_order ?? 0)
const active = ref(props.table?.is_active ?? true)
const saving = ref(false)
const error = ref('')
const errors = ref({})

function close() {
  if (!saving.value) emit('close')
}

async function submit() {
  if (saving.value) return
  errors.value = {}
  error.value = ''
  if (!name.value.trim() || name.value.trim().length > 50)
    errors.value.name = ['Enter a name of 1–50 characters.']
  if (
    capacity.value === '' ||
    !Number.isInteger(Number(capacity.value)) ||
    capacity.value < 1 ||
    capacity.value > 100
  )
    errors.value.capacity = ['Enter a whole number from 1 to 100.']
  if (
    displayOrder.value === '' ||
    !Number.isInteger(Number(displayOrder.value)) ||
    displayOrder.value < 0
  )
    errors.value.display_order = ['Enter a whole number of 0 or greater.']
  if (Object.keys(errors.value).length) return
  const payload = {
    name: name.value.trim(),
    capacity: Number(capacity.value),
    display_order: Number(displayOrder.value),
    is_active: active.value,
  }
  if (!editing.value && props.branchId) payload.branch_id = Number(props.branchId)
  saving.value = true
  try {
    if (editing.value) await updateTable(props.table.id, payload)
    else await createTable(payload)
    emit('saved')
  } catch (cause) {
    errors.value = cause.response?.data?.errors ?? {}
    error.value = tableError(cause, 'Could not save the table. Please try again.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog :open="true" class="relative z-50" @close="close">
    <div class="bg-secondary-900/50 fixed inset-0" aria-hidden="true" />
    <div class="fixed inset-0 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div class="flex items-start justify-between gap-4">
            <div>
              <DialogTitle class="text-secondary-900 text-lg font-semibold">{{
                editing ? 'Edit table' : 'Add table'
              }}</DialogTitle>
              <p class="text-secondary-500 mt-1 text-sm">{{ branchName }}</p>
            </div>
            <button
              type="button"
              class="hover:bg-secondary-100 rounded-lg p-2"
              aria-label="Close table form"
              :disabled="saving"
              @click="close"
            >
              <XMarkIcon class="size-5" />
            </button>
          </div>
          <p
            v-if="error"
            role="alert"
            class="bg-danger-50 text-danger-700 mt-4 rounded-lg p-3 text-sm"
          >
            {{ error }}
          </p>
          <form class="mt-6 space-y-5" @submit.prevent="submit">
            <fieldset :disabled="saving" class="space-y-5">
              <div>
                <label for="table-name" class="form-label">Table name</label>
                <input
                  id="table-name"
                  v-model="name"
                  class="form-input"
                  required
                  maxlength="50"
                  placeholder="e.g. Dining 01"
                  autocomplete="off"
                  :aria-invalid="!!errors.name"
                  :aria-describedby="errors.name ? 'name-error' : undefined"
                />
                <p v-if="errors.name" id="name-error" class="field-error">{{ errors.name[0] }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="table-capacity" class="form-label">Seats</label>
                  <input
                    id="table-capacity"
                    v-model="capacity"
                    class="form-input"
                    type="number"
                    required
                    min="1"
                    step="1"
                    :aria-invalid="!!errors.capacity"
                    aria-describedby="capacity-error"
                  />
                  <p id="capacity-error" class="field-error">{{ errors.capacity?.[0] }}</p>
                </div>
                <div>
                  <label for="table-order" class="form-label">Display order</label>
                  <input
                    id="table-order"
                    v-model="displayOrder"
                    class="form-input"
                    type="number"
                    required
                    min="0"
                    step="1"
                    :aria-invalid="!!errors.display_order"
                    aria-describedby="order-help order-error"
                  />
                  <p id="order-help" class="text-secondary-500 mt-1.5 text-xs">
                    Lower numbers appear first.
                  </p>
                  <p id="order-error" class="field-error">{{ errors.display_order?.[0] }}</p>
                </div>
              </div>
              <div class="bg-secondary-50 flex items-center justify-between rounded-lg px-4 py-3">
                <div>
                  <p class="text-secondary-700 text-sm font-medium">Active table</p>
                  <p class="text-secondary-500 text-xs">
                    Turn off to take this table out of service.
                  </p>
                </div>
                <Switch
                  v-model="active"
                  :class="active ? 'bg-success-600' : 'bg-secondary-200'"
                  class="focus:ring-primary-200 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                  aria-label="Active table"
                  :disabled="saving"
                >
                  <span
                    class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition"
                    :class="active ? 'translate-x-5' : 'translate-x-0'"
                  />
                </Switch>
              </div>
              <p v-if="errors.is_active" class="field-error">{{ errors.is_active[0] }}</p>
            </fieldset>
            <div class="border-secondary-100 flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                class="border-secondary-300 rounded-lg border px-4 py-2.5 text-sm font-medium"
                :disabled="saving"
                @click="close"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                :disabled="saving"
              >
                {{ saving ? 'Saving…' : editing ? 'Save changes' : 'Add table' }}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
@reference '../../assets/main.css';
.form-label {
  @apply text-secondary-700 mb-1.5 block text-sm font-medium;
}
.form-input {
  @apply border-secondary-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none;
}
.field-error {
  @apply text-danger-600 mt-1 text-xs;
}
</style>
