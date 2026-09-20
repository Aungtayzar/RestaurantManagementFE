<script setup>
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'

defineProps({ item: { type: Object, default: null } })
defineEmits(['pick', 'close'])
</script>

<template>
  <Dialog :open="Boolean(item)" class="relative z-50" @close="$emit('close')">
    <div class="fixed inset-0 bg-black/40" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel v-if="item" class="w-full max-w-sm space-y-4 rounded-xl bg-white p-5 shadow-xl">
        <DialogTitle class="text-secondary-900 text-lg font-semibold">{{ item.name }}</DialogTitle>
        <ul class="space-y-2">
          <li v-for="variant in item.variants" :key="variant.id">
            <button
              type="button"
              class="border-secondary-200 hover:border-primary-500 flex w-full cursor-pointer justify-between rounded-lg border px-3 py-2 text-sm"
              @click="$emit('pick', item, variant)"
            >
              <span>{{ variant.name }}</span>
              <span class="font-semibold">${{ Number(variant.price).toFixed(2) }}</span>
            </button>
          </li>
        </ul>
        <button
          type="button"
          class="text-secondary-500 cursor-pointer text-sm"
          @click="$emit('close')"
        >
          Cancel
        </button>
      </DialogPanel>
    </div>
  </Dialog>
</template>
