<script setup>
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useCartStore } from '@/stores/cart'
import BaseButton from '@/components/common/BaseButton.vue'
import TablePicker from './TablePicker.vue'

defineProps({
  orderType: { type: String, required: true },
  tableId: { type: [Number, null], default: null },
  tables: { type: Array, default: () => [] },
  submitting: Boolean,
  canSubmit: Boolean,
})
defineEmits(['update:orderType', 'update:tableId', 'submit'])

const cart = useCartStore()
const types = [
  { value: 'dine_in', label: 'Dine-in' },
  { value: 'takeaway', label: 'Takeaway' },
]
</script>

<template>
  <aside class="border-secondary-200 flex flex-col gap-4 rounded-xl border bg-white p-4">
    <div class="bg-secondary-100 grid grid-cols-2 gap-1 rounded-lg p-1">
      <button
        v-for="type in types"
        :key="type.value"
        type="button"
        :class="[
          'cursor-pointer rounded-md py-1.5 text-sm font-medium',
          orderType === type.value ? 'text-primary-700 bg-white shadow-sm' : 'text-secondary-500',
        ]"
        @click="$emit('update:orderType', type.value)"
      >
        {{ type.label }}
      </button>
    </div>

    <TablePicker
      v-if="orderType === 'dine_in'"
      :tables="tables"
      :model-value="tableId"
      @update:model-value="$emit('update:tableId', $event)"
    />

    <p v-if="!cart.lines.length" class="text-secondary-400 py-6 text-center text-sm">
      Cart is empty. Tap an item to add it.
    </p>
    <ul v-else class="-mx-1 max-h-96 space-y-3 overflow-y-auto px-1 py-0.5">
      <li v-for="line in cart.lines" :key="line.key" class="space-y-1">
        <div class="flex items-start justify-between gap-2 text-sm">
          <div>
            <p class="text-secondary-900 font-medium">{{ line.name }}</p>
            <p v-if="line.variant_name" class="text-secondary-500 text-xs">
              {{ line.variant_name }}
            </p>
          </div>
          <span class="font-semibold">${{ (line.price * line.quantity).toFixed(2) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease"
            class="cursor-pointer"
            @click="cart.decrement(line.key)"
          >
            <MinusIcon class="size-5" />
          </button>
          <span class="w-6 text-center text-sm">{{ line.quantity }}</span>
          <button
            type="button"
            aria-label="Increase"
            class="cursor-pointer"
            @click="cart.increment(line.key)"
          >
            <PlusIcon class="size-5" />
          </button>
          <button
            type="button"
            aria-label="Remove"
            class="ml-auto cursor-pointer"
            @click="cart.remove(line.key)"
          >
            <TrashIcon class="text-secondary-400 size-5" />
          </button>
        </div>
        <input
          :value="line.notes"
          type="text"
          placeholder="Note (e.g. no sugar)"
          class="border-secondary-200 w-full focus:ring-primary-400 rounded-md border px-2 py-1 text-xs outline-none focus:ring-1"
          @input="cart.setNotes(line.key, $event.target.value)"
        />
      </li>
    </ul>

    <div class="border-secondary-200 flex justify-between border-t pt-3 text-sm">
      <span class="text-secondary-500">Subtotal</span>
      <span class="font-semibold">${{ cart.subtotal.toFixed(2) }}</span>
    </div>
    <p class="text-secondary-400 text-xs">
      Tax and service charge are added when the order is placed.
    </p>
    <BaseButton block :loading="submitting" :disabled="!canSubmit" @click="$emit('submit')">
      {{ submitting ? 'Placing order...' : 'Place order' }}
    </BaseButton>
  </aside>
</template>
