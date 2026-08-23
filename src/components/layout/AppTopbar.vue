<script setup>
import { ArrowRightStartOnRectangleIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const initials = computed(() =>
  (auth.user?.name ?? '?')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const roleLabel = computed(() => auth.user?.roles?.[0] ?? '')

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header
    class="border-secondary-200 flex h-16 shrink-0 items-center justify-end border-b bg-white px-6"
  >
    <div class="flex items-center gap-3">
      <span
        class="bg-primary-100 text-primary-700 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
      >
        {{ initials }}
      </span>
      <div class="leading-tight">
        <p class="text-secondary-900 text-sm font-medium">{{ auth.user?.name }}</p>
        <p class="text-secondary-500 text-xs capitalize">{{ roleLabel }}</p>
      </div>
      <button
        type="button"
        title="Logout"
        class="text-secondary-500 hover:bg-danger-50 hover:text-danger-600 ml-2 rounded-lg p-2 transition-colors focus:outline-none"
        @click="handleLogout"
      >
        <ArrowRightStartOnRectangleIcon class="h-5 w-5" />
      </button>
    </div>
  </header>
</template>
