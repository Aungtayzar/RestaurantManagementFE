<script setup>
import { BuildingStorefrontIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { name: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
  { name: 'branches', label: 'Branches', icon: BuildingStorefrontIcon },
]
</script>

<template>
  <aside class="bg-secondary-900 flex w-64 shrink-0 flex-col">
    <div class="border-secondary-800 flex h-16 items-center gap-3 border-b px-6">
      <span
        class="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
      >
        R
      </span>
      <span class="text-sm font-semibold text-white">Restaurant MS</span>
    </div>

    <nav class="flex-1 space-y-1 px-3 py-4">
      <RouterLink
        v-for="item in menuItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
        :class="
          route.name === item.name
            ? 'bg-primary-600 text-white'
            : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
        "
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
