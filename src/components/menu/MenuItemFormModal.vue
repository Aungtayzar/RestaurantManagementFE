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
import { CakeIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { createMenuItem, updateMenuItem, getImageUrl } from '@/api/menuItems'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const props = defineProps({
  open: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  menuItem: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEditing = computed(() => !!props.menuItem)

const isSaving = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  description: '',
  base_price: '',
  category_id: '',
  is_available: true,
})

const variants = ref([])
const imageFile = ref(null)
const imagePreview = ref('')
const existingImagePath = ref('')
const removeImage = ref(false)

const hasImageToRemove = computed(
  () => !!imageFile.value || (isEditing.value && !!existingImagePath.value && !removeImage.value),
)

function revokePreview() {
  if (imagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
}

function resetForm() {
  errorMessage.value = ''
  isSaving.value = false
  form.name = props.menuItem?.name ?? ''
  form.description = props.menuItem?.description ?? ''
  form.base_price = props.menuItem?.base_price ?? ''
  form.category_id = props.menuItem?.category_id ? String(props.menuItem.category_id) : ''
  form.is_available = props.menuItem ? Boolean(props.menuItem.is_available) : true
  variants.value = (props.menuItem?.variants ?? []).map((variant) => ({
    name: variant.name,
    price: String(variant.price ?? ''),
  }))
  existingImagePath.value = props.menuItem?.image_path ?? ''
  revokePreview()
  imageFile.value = null
  imagePreview.value = existingImagePath.value ? getImageUrl(existingImagePath.value) : ''
  removeImage.value = false
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetForm()
  },
  { immediate: true },
)

function handleClose() {
  if (isSaving.value) return
  emit('close')
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
    imagePreview.value = existingImagePath.value ? getImageUrl(existingImagePath.value) : ''
    return
  }
  if (existingImagePath.value) {
    removeImage.value = true
    imagePreview.value = ''
  }
}

function addVariant() {
  variants.value.push({ name: '', price: '' })
}

function removeVariant(index) {
  variants.value.splice(index, 1)
}

function extractErrorMessage(error) {
  const data = error.response?.data
  const validationError = data?.errors && Object.values(data.errors)[0]
  if (Array.isArray(validationError) && validationError.length > 0) {
    return validationError[0]
  }
  return data?.message ?? 'Failed to save menu item. Please try again.'
}

function validate() {
  if (!form.name.trim()) {
    return 'Name is required.'
  }
  if (!form.category_id) {
    return 'Category is required.'
  }
  if (form.base_price === '' || Number.isNaN(Number(form.base_price))) {
    return 'Base price is required.'
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

  const payload = new FormData()
  payload.append('name', form.name.trim())
  payload.append('description', form.description.trim())
  payload.append('base_price', form.base_price)
  payload.append('category_id', form.category_id)
  payload.append('is_available', form.is_available ? '1' : '0')

  if (imageFile.value) {
    payload.append('image', imageFile.value)
  }
  if (removeImage.value) {
    payload.append('remove_image', '1')
  }

  let variantIndex = 0

  variants.value.forEach((variant) => {
    if (variant.name.trim()) {
      payload.append(`variants[${variantIndex}][name]`, variant.name.trim())
      payload.append(`variants[${variantIndex}][price]`, variant.price)

      variantIndex++
    }
  })

  if (isEditing.value && variantIndex === 0) {
    payload.append('remove_variants', '1')
  }

  isSaving.value = true

  try {
    if (isEditing.value) {
      await updateMenuItem(props.menuItem.id, payload)
      toast.success('Menu item updated successfully')
    } else {
      await createMenuItem(payload)
      toast.success('Menu item created successfully')
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
                    {{ isEditing ? 'Edit menu item' : 'New menu item' }}
                  </DialogTitle>
                  <p class="text-secondary-500 mt-1 text-sm">
                    {{ isEditing ? 'Update this menu item' : 'Add a new item to your menu' }}
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
                    for="menu-item-name"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Name <span class="text-danger-500">*</span>
                  </label>
                  <input
                    id="menu-item-name"
                    v-model="form.name"
                    type="text"
                    required
                    placeholder="Item name"
                    autocomplete="off"
                    class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  />
                </div>

                <div>
                  <label
                    for="menu-item-description"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Description
                  </label>
                  <textarea
                    id="menu-item-description"
                    v-model="form.description"
                    rows="3"
                    placeholder="Optional description"
                    class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  />
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      for="menu-item-base-price"
                      class="text-secondary-700 mb-1.5 block text-sm font-medium"
                    >
                      Base price <span class="text-danger-500">*</span>
                    </label>
                    <input
                      id="menu-item-base-price"
                      v-model="form.base_price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      autocomplete="off"
                      class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                      :disabled="isSaving"
                    />
                  </div>

                  <div>
                    <label
                      for="menu-item-category"
                      class="text-secondary-700 mb-1.5 block text-sm font-medium"
                    >
                      Category <span class="text-danger-500">*</span>
                    </label>
                    <select
                      id="menu-item-category"
                      v-model="form.category_id"
                      required
                      class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                      :disabled="isSaving"
                    >
                      <option value="" disabled>Select a category</option>
                      <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">
                        {{ cat.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    for="menu-item-image"
                    class="text-secondary-700 mb-1.5 block text-sm font-medium"
                  >
                    Image
                  </label>
                  <div class="flex items-start gap-4">
                    <div
                      class="bg-secondary-100 flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                    >
                      <img
                        v-if="imagePreview"
                        :src="imagePreview"
                        alt="Image preview"
                        class="h-full w-full object-cover"
                      />
                      <CakeIcon v-else class="text-secondary-300 h-8 w-8" />
                    </div>
                    <div class="flex flex-col items-start gap-2">
                      <label
                        for="menu-item-image"
                        class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 inline-flex cursor-pointer items-center rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Upload image
                      </label>
                      <input
                        id="menu-item-image"
                        type="file"
                        accept="image/*"
                        class="sr-only"
                        :disabled="isSaving"
                        @change="handleImageChange"
                      />
                      <button
                        v-if="hasImageToRemove"
                        type="button"
                        aria-label="Remove image"
                        class="text-danger-600 hover:text-danger-700 inline-flex items-center gap-1 text-xs font-semibold transition"
                        :disabled="isSaving"
                        @click="handleRemoveImage"
                      >
                        <TrashIcon class="h-3.5 w-3.5" />
                        Remove image
                      </button>
                      <p class="text-secondary-400 text-xs">Max 2MB. JPG, PNG, or GIF.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-center justify-between">
                    <label class="text-secondary-700 block text-sm font-medium">Variants</label>
                    <button
                      type="button"
                      class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="isSaving"
                      @click="addVariant"
                    >
                      <PlusIcon class="h-3.5 w-3.5" />
                      Add variant
                    </button>
                  </div>

                  <div v-if="variants.length === 0" class="text-secondary-400 text-sm italic">
                    No variants. Items without variants use only the base price.
                  </div>

                  <div
                    v-for="(variant, index) in variants"
                    :key="index"
                    class="flex items-end gap-2"
                  >
                    <div class="flex-1">
                      <label
                        :for="`variant-name-${index}`"
                        class="text-secondary-500 mb-1 block text-xs font-medium"
                      >
                        Name
                      </label>
                      <input
                        :id="`variant-name-${index}`"
                        v-model="variant.name"
                        type="text"
                        placeholder="e.g. Regular"
                        autocomplete="off"
                        class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                        :disabled="isSaving"
                      />
                    </div>
                    <div class="w-28">
                      <label
                        :for="`variant-price-${index}`"
                        class="text-secondary-500 mb-1 block text-xs font-medium"
                      >
                        Price
                      </label>
                      <input
                        :id="`variant-price-${index}`"
                        v-model="variant.price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        autocomplete="off"
                        class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                        :disabled="isSaving"
                      />
                    </div>
                    <button
                      type="button"
                      :aria-label="`Remove variant ${index + 1}`"
                      class="text-secondary-400 hover:text-danger-600 mb-0.5 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="isSaving"
                      @click="removeVariant(index)"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div class="bg-secondary-50 flex items-center justify-between rounded-lg px-4 py-3">
                  <div>
                    <p class="text-secondary-700 text-sm font-medium">Available</p>
                    <p class="text-secondary-500 text-xs">Item is available for ordering</p>
                  </div>
                  <Switch
                    v-model="form.is_available"
                    :class="form.is_available ? 'bg-success-600' : 'bg-secondary-200'"
                    class="focus:ring-primary-200 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                    :disabled="isSaving"
                  >
                    <span
                      class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition"
                      :class="form.is_available ? 'translate-x-5' : 'translate-x-0'"
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
                    {{
                      isSaving
                        ? isEditing
                          ? 'Saving…'
                          : 'Creating…'
                        : isEditing
                          ? 'Save changes'
                          : 'Create item'
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
