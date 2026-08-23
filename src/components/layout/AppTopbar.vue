<script setup>
import { ArrowRightStartOnRectangleIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import SidebarToggleIcon from '@/components/common/SidebarToggleIcon.vue'
import AppTooltip from '@/components/common/AppTooltip.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const isToggleFlipped = computed(() =>
  ui.isMobileViewport ? !ui.isMobileOpen : ui.isCollapsed,
)

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
    class="border-secondary-200 flex h-16 shrink-0 items-center justify-between border-b bg-white px-6"
  >
    <button
      type="button"
      aria-label="Toggle sidebar"
      class="text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 relative rounded-lg p-2 transition-colors group focus:outline-none"
      @click="ui.toggleSidebar()"
    >
      <SidebarToggleIcon :class="isToggleFlipped ? 'rotate-180' : ''" />
      <AppTooltip label="Toggle sidebar" placement="bottom" />
    </button>

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
        aria-label="Logout"
        class="text-secondary-500 hover:bg-danger-50 hover:text-danger-600 relative ml-2 rounded-lg p-2 transition-colors group focus:outline-none"
        @click="handleLogout"
      >
        <ArrowRightStartOnRectangleIcon class="h-5 w-5" />
        <AppTooltip label="Logout" placement="bottom" />
      </button>
    </div>
  </header>
</template>
