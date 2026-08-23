<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <h1>{{ auth.user?.name }}</h1>
</template>
