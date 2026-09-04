<script setup>
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

defineProps({
  open: { type: Boolean, default: false },
  itemName: { type: String, required: true },
  message: { type: String, default: 'This action cannot be undone.' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" class="relative z-[60]" @close="loading ? undefined : emit('close')">
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
            <DialogPanel class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <div class="flex items-start gap-3">
                <div class="bg-danger-100 text-danger-600 rounded-full p-2">
                  <ExclamationTriangleIcon class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <DialogTitle as="h3" class="text-secondary-900 text-lg font-semibold">
                    Are you sure you want to delete {{ itemName }}?
                  </DialogTitle>
                  <p class="text-secondary-500 mt-2 text-sm">{{ message }}</p>
                </div>
              </div>

              <div class="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  data-testid="cancel-delete-button"
                  class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="loading"
                  @click="emit('close')"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="confirm-delete-button"
                  class="bg-danger-600 hover:bg-danger-700 focus:ring-danger-200 disabled:bg-danger-400 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                  :disabled="loading"
                  @click="emit('confirm')"
                >
                  {{ loading ? 'Deleting…' : 'Delete' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
