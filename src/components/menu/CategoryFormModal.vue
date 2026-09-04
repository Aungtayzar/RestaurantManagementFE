<script setup>
import { computed, ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { PhotoIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { createCategory, getCategoryImageUrl, updateCategory } from '@/api/categories'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const props = defineProps({
  open: { type: Boolean, default: false },
  category: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])
const isEditing = computed(() => Boolean(props.category))
const name = ref('')
const displayOrder = ref('0')
const imageFile = ref(null)
const imagePreview = ref('')
const existingImagePath = ref('')
const removeImage = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const hasImageToRemove = computed(
  () => !!imageFile.value || (isEditing.value && !!existingImagePath.value && !removeImage.value),
)

function revokePreview() {
  if (imagePreview.value.startsWith('blob:')) URL.revokeObjectURL(imagePreview.value)
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.category?.name ?? ''
    displayOrder.value = String(props.category?.display_order ?? 0)
    existingImagePath.value = props.category?.image_path ?? ''
    revokePreview()
    imageFile.value = null
    imagePreview.value = existingImagePath.value ? getCategoryImageUrl(existingImagePath.value) : ''
    removeImage.value = false
    errorMessage.value = ''
    isSaving.value = false
  },
  { immediate: true },
)

function close() {
  if (!isSaving.value) emit('close')
}

function handleImageChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  errorMessage.value = ''
  if (file.size > MAX_IMAGE_BYTES) {
    errorMessage.value = 'Image must be 2MB or smaller.'
    return
  }

  revokePreview()
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  removeImage.value = false
}

function handleRemoveImage() {
  if (imageFile.value) {
    revokePreview()
    imageFile.value = null
    imagePreview.value = existingImagePath.value ? getCategoryImageUrl(existingImagePath.value) : ''
    return
  }

  if (existingImagePath.value) {
    removeImage.value = true
    imagePreview.value = ''
  }
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
  if (!/^\d+$/.test(displayOrder.value)) {
    errorMessage.value = 'Display order must be a whole number of 0 or greater.'
    return
  }

  const payload = new FormData()
  payload.append('name', trimmedName)
  payload.append('display_order', displayOrder.value)
  if (imageFile.value) payload.append('image', imageFile.value)
  if (removeImage.value) payload.append('remove_image', '1')
  isSaving.value = true

  try {
    const response = isEditing.value
      ? await updateCategory(props.category.id, payload)
      : await createCategory(payload)
    toast.success(
      isEditing.value ? 'Category updated successfully' : 'Category created successfully',
    )
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

              <form class="mt-5 space-y-4" @submit.prevent="submit">
                <div>
                  <label
                    for="category-name"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Name <span class="text-danger-500">*</span>
                  </label>
                  <input
                    id="category-name"
                    v-model="name"
                    type="text"
                    required
                    autocomplete="off"
                    placeholder="Category name"
                    class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                    :disabled="isSaving"
                  />
                </div>

                <div>
                  <label
                    for="category-display-order"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Display order
                  </label>
                  <input
                    id="category-display-order"
                    v-model="displayOrder"
                    type="number"
                    min="0"
                    step="1"
                    required
                    class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                    :disabled="isSaving"
                  />
                  <p class="text-secondary-400 mt-1 text-xs">Lower numbers appear first.</p>
                </div>

                <div>
                  <label
                    for="category-image"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Image
                  </label>
                  <div class="flex items-start gap-4">
                    <div
                      class="bg-secondary-100 flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                    >
                      <img
                        v-if="imagePreview"
                        :src="imagePreview"
                        alt="Category image preview"
                        class="h-full w-full object-cover"
                      />
                      <PhotoIcon v-else class="text-secondary-300 h-8 w-8" />
                    </div>
                    <div class="flex flex-col items-start gap-2">
                      <label
                        for="category-image"
                        class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 inline-flex cursor-pointer items-center rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition"
                      >
                        Upload image
                      </label>
                      <input
                        id="category-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        class="sr-only"
                        :disabled="isSaving"
                        @change="handleImageChange"
                      />
                      <button
                        v-if="hasImageToRemove"
                        type="button"
                        aria-label="Remove category image"
                        class="text-danger-600 hover:text-danger-700 inline-flex items-center gap-1 text-xs font-semibold transition"
                        :disabled="isSaving"
                        @click="handleRemoveImage"
                      >
                        <TrashIcon class="h-3.5 w-3.5" />
                        Remove image
                      </button>
                      <p class="text-secondary-400 text-xs">Max 2MB. JPG, PNG, or WebP.</p>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-3 pt-2">
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
