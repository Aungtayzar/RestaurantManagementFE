<script setup>
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { CakeIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ArrowPathIcon } from '@heroicons/vue/20/solid'
import { toast } from 'vue3-toastify'
import { getMenuItem, deleteMenuItem, getImageUrl } from '@/api/menuItems'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  menuItemId: { type: Number, default: null },
})

const emit = defineEmits(['close', 'edit', 'deleted'])

const menuItem = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.menuItemId) {
      fetchMenuItem(props.menuItemId)
    }
    if (!isOpen) {
      showDeleteConfirm.value = false
    }
  },
  { immediate: true },
)

function formatPrice(price) {
  return `$${Number.parseFloat(price).toFixed(2)}`
}

async function fetchMenuItem(id) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getMenuItem(id)
    menuItem.value = data.data
  } catch {
    errorMessage.value = 'Failed to load menu item details. Please try again.'
    menuItem.value = null
  } finally {
    isLoading.value = false
  }
}

function handleRetry() {
  if (props.menuItemId) {
    fetchMenuItem(props.menuItemId)
  }
}

function handleEdit() {
  emit('edit', menuItem.value)
}

function handleDeleteClick() {
  showDeleteConfirm.value = true
}

function handleDeleteCancel() {
  showDeleteConfirm.value = false
}

async function handleDeleteConfirm() {
  if (!menuItem.value) return

  isDeleting.value = true
  try {
    await deleteMenuItem(menuItem.value.id)
    toast.success('Menu item deleted')
    emit('deleted')
    emit('close')
  } catch {
    toast.error('Failed to delete menu item. Please try again.')
  } finally {
    isDeleting.value = false
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
                <div v-else-if="menuItem" class="flex min-w-0 items-center gap-3">
                  <div class="bg-primary-100 text-primary-600 rounded-lg p-2">
                    <CakeIcon class="h-6 w-6" />
                  </div>
                  <div class="min-w-0">
                    <DialogTitle as="h3" class="text-secondary-900 truncate text-lg font-semibold">
                      {{ menuItem.name }}
                    </DialogTitle>
                    <span
                      class="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      :class="
                        menuItem.is_available
                          ? 'bg-success-100 text-success-700'
                          : 'bg-danger-100 text-danger-700'
                      "
                    >
                      {{ menuItem.is_available ? 'Available' : 'Unavailable' }}
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
                aria-label="Loading menu item details"
              >
                <section class="space-y-2">
                  <BaseSkeleton class="h-3 w-16" />
                  <BaseSkeleton class="h-48 w-full rounded-lg" />
                </section>

                <section class="space-y-2">
                  <BaseSkeleton class="h-3 w-14" />
                  <div class="space-y-2.5">
                    <BaseSkeleton class="h-3 w-2/3" />
                    <BaseSkeleton class="h-3 w-1/2" />
                  </div>
                </section>

                <section class="space-y-2">
                  <BaseSkeleton class="h-3 w-20" />
                  <BaseSkeleton class="h-9 w-full rounded-lg" />
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

              <div v-else-if="menuItem" class="space-y-5 p-6">
                <section>
                  <h4
                    class="text-secondary-400 mb-2 text-xs font-semibold tracking-wide uppercase"
                  >
                    Image
                  </h4>
                  <div
                    class="bg-secondary-100 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg"
                  >
                    <img
                      v-if="menuItem.image_path"
                      :src="getImageUrl(menuItem.image_path)"
                      :alt="menuItem.name"
                      class="h-full w-full object-cover"
                    />
                    <CakeIcon v-else class="text-secondary-300 h-12 w-12" />
                  </div>
                </section>

                <section>
                  <h4
                    class="text-secondary-400 mb-2 text-xs font-semibold tracking-wide uppercase"
                  >
                    Details
                  </h4>
                  <div class="space-y-2 text-sm">
                    <div>
                      <p class="text-secondary-500">Category</p>
                      <span
                        class="bg-primary-100 text-primary-700 mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {{ menuItem.category_name }}
                      </span>
                    </div>
                    <div>
                      <p class="text-secondary-500">Description</p>
                      <p v-if="menuItem.description" class="text-secondary-700">
                        {{ menuItem.description }}
                      </p>
                      <p v-else class="text-secondary-400 italic">No description</p>
                    </div>
                    <div>
                      <p class="text-secondary-500">Base price</p>
                      <p class="text-secondary-900 text-base font-semibold">
                        {{ formatPrice(menuItem.base_price) }}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4
                    class="text-secondary-400 mb-2 text-xs font-semibold tracking-wide uppercase"
                  >
                    Variants
                  </h4>
                  <div
                    v-if="menuItem.variants && menuItem.variants.length > 0"
                    class="border-secondary-200 overflow-hidden rounded-lg border"
                  >
                    <table class="min-w-full text-sm">
                      <thead class="bg-secondary-50">
                        <tr>
                          <th
                            class="text-secondary-500 px-4 py-2.5 text-left text-xs font-semibold uppercase"
                          >
                            Name
                          </th>
                          <th
                            class="text-secondary-500 px-4 py-2.5 text-right text-xs font-semibold uppercase"
                          >
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-secondary-200 divide-y">
                        <tr
                          v-for="variant in menuItem.variants"
                          :key="variant.id"
                        >
                          <td class="text-secondary-900 px-4 py-2.5">
                            {{ variant.name }}
                          </td>
                          <td class="text-secondary-900 px-4 py-2.5 text-right font-medium">
                            {{ formatPrice(variant.price) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p v-else class="text-secondary-400 italic text-sm">No variants</p>
                </section>

                <div class="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    data-testid="delete-button"
                    class="border-danger-300 text-danger-700 hover:bg-danger-50 inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold transition"
                    @click="handleDeleteClick"
                  >
                    <TrashIcon class="h-4 w-4" />
                    Delete
                  </button>
                  <button
                    type="button"
                    data-testid="edit-button"
                    class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none"
                    @click="handleEdit"
                  >
                    <PencilIcon class="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>

      <TransitionRoot appear :show="showDeleteConfirm" as="template">
        <Dialog as="div" class="relative z-[60]" @close="handleDeleteCancel">
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
                <DialogPanel
                  class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
                >
                  <DialogTitle
                    as="h3"
                    class="text-secondary-900 text-lg font-semibold"
                  >
                    Delete {{ menuItem?.name }}?
                  </DialogTitle>
                  <p class="text-secondary-500 mt-2 text-sm">
                    This action cannot be undone.
                  </p>
                  <div class="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      data-testid="cancel-delete-button"
                      class="border-secondary-300 text-secondary-700 hover:bg-secondary-50 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="isDeleting"
                      @click="handleDeleteCancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      data-testid="confirm-delete-button"
                      class="bg-danger-600 hover:bg-danger-700 focus:ring-danger-200 disabled:bg-danger-400 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                      :disabled="isDeleting"
                      @click="handleDeleteConfirm"
                    >
                      {{ isDeleting ? 'Deleting…' : 'Delete' }}
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </TransitionRoot>
    </Dialog>
  </TransitionRoot>
</template>
