<script setup>
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
</script>

<template>
  <div class="border-secondary-200 flex flex-col rounded-xl border bg-white">
    <div class="flex items-start justify-between gap-3 p-5 pb-0">
      <div class="flex items-center gap-3">
        <BaseSkeleton class="h-10 w-10 rounded-lg" />
        <BaseSkeleton class="h-4 w-28" />
      </div>
      <BaseSkeleton class="h-5 w-16 rounded-full" />
    </div>

    <div class="mt-4 space-y-2.5 px-5">
      <div class="flex items-center gap-2">
        <BaseSkeleton class="h-4 w-4 shrink-0 rounded-full" />
        <BaseSkeleton class="h-3 w-2/3" />
      </div>
      <div class="flex items-center gap-2">
        <BaseSkeleton class="h-4 w-4 shrink-0 rounded-full" />
        <BaseSkeleton class="h-3 w-1/2" />
      </div>
    </div>

    <div class="mt-auto px-5 pt-4 pb-5">
      <div class="divide-secondary-200 bg-secondary-50 grid grid-cols-2 divide-x rounded-lg">
        <div class="space-y-1.5 px-4 py-3">
          <BaseSkeleton class="h-3 w-14" />
          <BaseSkeleton class="h-4 w-10" />
        </div>
        <div class="space-y-1.5 px-4 py-3">
          <BaseSkeleton class="h-3 w-20" />
          <BaseSkeleton class="h-4 w-10" />
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-3">
        <BaseSkeleton class="h-9 rounded-lg" />
        <BaseSkeleton class="h-9 rounded-lg" />
      </div>
    </div>
  </div>
</template>
