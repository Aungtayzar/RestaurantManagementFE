<script setup>
import { useRoute, useRouter } from 'vue-router'
import PaymentReportPanel from '@/components/reports/PaymentReportPanel.vue'

const route = useRoute()
const router = useRouter()
function saveFilters(filters) {
  router.replace({ query: filters })
}
</script>

<template>
  <div class="mx-auto max-w-[1500px] pb-8">
    <PaymentReportPanel :initial-filters="route.query" @apply="saveFilters" />
  </div>
</template>
