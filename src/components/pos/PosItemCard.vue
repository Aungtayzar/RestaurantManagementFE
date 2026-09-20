<script setup>
defineProps({ item: { type: Object, required: true } })
defineEmits(['select'])
</script>

<template>
  <button
    type="button"
    class="border-secondary-200 hover:border-primary-500 flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition"
    @click="$emit('select', item)"
  >
    <img
      v-if="item.image_url"
      :src="item.image_url"
      :alt="item.name"
      class="h-28 w-full object-cover"
    />
    <div
      v-else
      class="bg-secondary-100 text-secondary-400 flex h-28 items-center justify-center text-3xl"
    >
      {{ item.name.charAt(0) }}
    </div>
    <div class="space-y-1 p-3">
      <p class="text-secondary-900 truncate text-sm font-medium">{{ item.name }}</p>
      <p
        v-if="item.description"
        :title="item.description"
        class="text-secondary-500 truncate text-xs"
      >
        {{ item.description }}
      </p>
      <p class="text-secondary-500 text-xs">
        {{ item.variants?.length ? `${item.variants.length} options` : 'Regular' }}
      </p>
      <p class="text-primary-600 text-sm font-semibold">
        ${{ Number(item.base_price).toFixed(2) }}
      </p>
    </div>
  </button>
</template>
