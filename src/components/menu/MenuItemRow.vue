<script setup>
import { computed } from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems, Switch } from '@headlessui/vue'
import { CakeIcon, EllipsisVerticalIcon, EyeIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { getImageUrl } from '@/api/menuItems'

const props = defineProps({
  menuItem: {
    type: Object,
    required: true,
  },
  updating: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-availability', 'edit', 'view'])

const MAX_DESCRIPTION_WORDS = 20

const imageSrc = computed(() => props.menuItem.image_url ?? getImageUrl(props.menuItem.image_path))

const trimmedDescription = computed(() => {
  const description = props.menuItem.description?.trim()
  if (!description) return ''
  const words = description.split(/\s+/)
  if (words.length <= MAX_DESCRIPTION_WORDS) return description
  return `${words.slice(0, MAX_DESCRIPTION_WORDS).join(' ')}…`
})

const variantSummary = computed(() =>
  (props.menuItem.variants ?? [])
    .map((variant) => `${variant.name} ${formatPrice(variant.price)}`)
    .join(' · '),
)

function formatPrice(price) {
  return `$${Number.parseFloat(price).toFixed(2)}`
}

function toggleAvailability() {
  emit('toggle-availability', {
    id: props.menuItem.id,
    currentStatus: props.menuItem.is_available,
  })
}
</script>

<template>
  <div
    class="flex items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4"
    :class="menuItem.is_available ? 'bg-white' : 'bg-secondary-50/60'"
  >
    <div
      class="bg-secondary-100 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-14 sm:w-14"
    >
      <img
        v-if="imageSrc"
        :src="imageSrc"
        :alt="menuItem.name"
        class="h-full w-full object-cover"
      />
      <CakeIcon v-else class="text-secondary-300 h-6 w-6" />
    </div>

    <div class="min-w-0 flex-1">
      <h3 class="text-secondary-900 truncate text-sm font-semibold">{{ menuItem.name }}</h3>
      <p v-if="trimmedDescription" class="text-secondary-500 truncate text-sm">
        {{ trimmedDescription }}
      </p>

      <p class="text-primary-600 w-20 shrink-0 text-sm font-semibold">
        {{ formatPrice(menuItem.base_price) }}
      </p>
      <p v-if="variantSummary" class="text-secondary-500 truncate text-xs">
        {{ variantSummary }}
      </p>
    </div>

    <div class="flex w-14 shrink-0 items-center justify-end gap-1.5 sm:w-28 sm:gap-2">
      <Switch
        :model-value="menuItem.is_available"
        :disabled="updating"
        data-testid="toggle-availability"
        aria-label="Toggle availability"
        :class="menuItem.is_available ? 'bg-success-600' : 'bg-secondary-200'"
        class="focus:ring-primary-200 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:ring-2 focus:outline-none"
        @update:model-value="toggleAvailability"
      >
        <span
          class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition"
          :class="menuItem.is_available ? 'translate-x-5' : 'translate-x-0'"
        />
      </Switch>
      <span
        class="hidden w-16 text-xs font-medium sm:inline"
        :class="menuItem.is_available ? 'text-success-600' : 'text-secondary-400'"
      >
        {{ menuItem.is_available ? 'Available' : 'Unavailable' }}
      </span>
    </div>

    <div class="shrink-0">
      <Menu as="div" class="relative">
        <MenuButton
          type="button"
          data-testid="row-menu"
          aria-label="Menu item actions"
          class="text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition"
        >
          <EllipsisVerticalIcon class="h-5 w-5" />
        </MenuButton>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <MenuItems
            class="border-secondary-200 absolute right-0 z-10 mt-1 w-36 origin-top-right rounded-lg border bg-white py-1 shadow-lg"
          >
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                data-testid="edit-option"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                :class="active ? 'bg-secondary-50 text-secondary-900' : 'text-secondary-700'"
                @click="emit('edit')"
              >
                <PencilIcon class="h-4 w-4" />
                Edit
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                data-testid="view-option"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                :class="active ? 'bg-secondary-50 text-secondary-900' : 'text-secondary-700'"
                @click="emit('view')"
              >
                <EyeIcon class="h-4 w-4" />
                View
              </button>
            </MenuItem>
          </MenuItems>
        </transition>
      </Menu>
    </div>
  </div>
</template>
