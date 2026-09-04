<script setup>
import { computed, ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { createCategory, updateCategory } from '@/api/categories'

const props = defineProps({
  open: { type: Boolean, default: false },
  category: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])
const isEditing = computed(() => Boolean(props.category))
const name = ref('')
const isSaving = ref(false)
const errorMessage = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.category?.name ?? ''
    errorMessage.value = ''
    isSaving.value = false
  },
  { immediate: true },
)

function close() {
  if (!isSaving.value) emit('close')
}

function extractError(error) {
  if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
  if (error.response?.status === 403) return 'You do not have permission to manage categories.'
  const validationError = error.response?.data?.errors?.name
  if (Array.isArray(validationError) && validationError.length) return validationError[0]
  return error.response?.data?.message ?? 'Failed to save category. Please try again.'
}

async function submit() {
  errorMessage.value = ''
  const trimmedName = name.value.trim()
  if (!trimmedName) {
    errorMessage.value = 'Name is required.'
    return
  }

  const payload = new FormData()
  payload.append('name', trimmedName)
  isSaving.value = true

  try {
    const response = isEditing.value
      ? await updateCategory(props.category.id, payload)
      : await createCategory(payload)
    toast.success(isEditing.value ? 'Category updated successfully' : 'Category created successfully')
    emit('saved', response.data)
    emit('close')
  } catch (error) {
    errorMessage.value = extractError(error)
    toast.error(errorMessage.value)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
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
            <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle as="h3" class="text-secondary-900 text-lg font-semibold">
                    {{ isEditing ? 'Edit category' : 'New category' }}
                  </DialogTitle>
                  <p class="text-secondary-500 mt-1 text-sm">
                    {{ isEditing ? 'Update the category name' : 'Add a category to your menu' }}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close category form"
                  class="text-secondary-400 hover:text-secondary-600 transition"
                  :disabled="isSaving"
                  @click="close"
                >
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>

              <p
                v-if="errorMessage"
                role="alert"
                class="bg-danger-50 text-danger-700 mt-4 rounded-lg px-4 py-3 text-sm font-medium"
              >
                {{ errorMessage }}
              </p>

              <form class="mt-5" @submit.prevent="submit">
                <label for="category-name" class="text-secondary-700 mb-1.5 block text-sm font-medium">
                  Name <span class="text-danger-500">*</span>
                </label>
                <input
                  id="category-name"
                  v-model="name"
                  type="text"
                  required
                  autocomplete="off"
                  placeholder="Category name"
                  class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:bg-secondary-50"
                  :disabled="isSaving"
                />

                <div class="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold transition"
                    :disabled="isSaving"
                    @click="close"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 disabled:bg-primary-400 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition focus:ring-2 focus:outline-none"
                    :disabled="isSaving"
                  >
                    {{ isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create category' }}
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
