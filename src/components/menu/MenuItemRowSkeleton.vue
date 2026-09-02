<script setup>
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
</script>

<template>
  <div class="flex items-center gap-2 border-b border-secondary-100 px-3 py-3 last:border-b-0 sm:gap-4 sm:px-4">
    <BaseSkeleton class="h-10 w-10 shrink-0 rounded-lg sm:h-14 sm:w-14" />

    <div class="min-w-0 flex-1 space-y-2">
      <BaseSkeleton class="h-4 w-40" />
      <BaseSkeleton class="h-3 w-full max-w-sm" />
    </div>

    <BaseSkeleton class="hidden h-4 w-14 shrink-0 sm:block" />
    <BaseSkeleton class="h-6 w-11 shrink-0 rounded-full" />
    <BaseSkeleton class="h-9 w-9 shrink-0 rounded-lg" />
  </div>
</template>