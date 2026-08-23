import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    isCollapsed: false,
    isMobileOpen: false,
    isMobileViewport: window.innerWidth < 768,
  }),
  actions: {
    toggleSidebar() {
      if (this.isMobileViewport) {
        this.isMobileOpen = !this.isMobileOpen
      } else {
        this.isCollapsed = !this.isCollapsed
      }
    },
    closeMobileSidebar() {
      this.isMobileOpen = false
    },
  },
})
