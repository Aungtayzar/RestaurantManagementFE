<script setup>
import {
  BuildingStorefrontIcon,
  Squares2X2Icon,
  UsersIcon,
  TableCellsIcon,
} from '@heroicons/vue/24/outline'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppTooltip from '@/components/common/AppTooltip.vue'
import MenuItemsIcon from '@/components/common/MenuItemsIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const menuItems = [
  { name: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
  { name: 'branches', label: 'Branches', icon: BuildingStorefrontIcon, roles: ['admin'] },
  { name: 'menu-items', label: 'Menu Items', icon: MenuItemsIcon, roles: ['admin', 'manager'] },
  { name: 'tables', label: 'Tables', icon: TableCellsIcon, roles: ['admin', 'manager', 'cashier'] },
  { name: 'staff', label: 'Staff', icon: UsersIcon, roles: ['admin', 'manager'] },
]

const visibleMenuItems = computed(() =>
  menuItems.filter(
    (item) => !item.roles || item.roles.some((role) => auth.user?.roles?.includes(role)),
  ),
)

const sidebarClasses = computed(() => {
  if (ui.isMobileViewport) {
    return [
      'fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200',
      ui.isMobileOpen ? 'translate-x-0' : '-translate-x-full',
    ]
  }
  return [ui.isCollapsed ? 'w-[72px]' : 'w-64', 'transition-all duration-200']
})

const desktopQuery = window.matchMedia('(min-width: 768px)')
function handleBreakpointChange(event) {
  ui.isMobileViewport = !event.matches
  ui.isMobileOpen = false
}
onMounted(() => desktopQuery.addEventListener('change', handleBreakpointChange))
onUnmounted(() => desktopQuery.removeEventListener('change', handleBreakpointChange))

watch(
  () => route.name,
  () => {
    if (ui.isMobileViewport) ui.closeMobileSidebar()
  },
)
</script>

<template>
  <div
    v-if="ui.isMobileViewport && ui.isMobileOpen"
    class="fixed inset-0 z-30 bg-black/40"
    @click="ui.closeMobileSidebar()"
  />

  <aside class="bg-secondary-900 flex shrink-0 flex-col" :class="sidebarClasses">
    <div
      class="border-secondary-800 flex h-16 shrink-0 items-center gap-3 border-b px-3"
      :class="!ui.isMobileViewport && ui.isCollapsed ? 'justify-center' : 'px-6'"
    >
      <span
        class="bg-primary-600 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
      >
        R
      </span>
      <span
        v-if="ui.isMobileViewport || !ui.isCollapsed"
        class="text-sm font-semibold whitespace-nowrap text-white"
      >
        Restaurant MS
      </span>
    </div>

    <nav class="flex-1 space-y-1 px-3 py-4">
      <RouterLink
        v-for="item in visibleMenuItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors"
        :class="[
          route.name === item.name
            ? 'bg-primary-600 text-white'
            : 'text-secondary-300 hover:bg-secondary-800 hover:text-white',
          !ui.isMobileViewport && ui.isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
        ]"
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        <span v-if="ui.isMobileViewport || !ui.isCollapsed">{{ item.label }}</span>
        <AppTooltip v-if="!ui.isMobileViewport && ui.isCollapsed" :label="item.label" />
      </RouterLink>
    </nav>
  </aside>
</template>
