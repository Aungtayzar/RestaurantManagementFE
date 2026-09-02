import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import AppSidebar from '../AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

function createRouterStub() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', name: 'dashboard', component: { template: '<div />' } },
      { path: '/dashboard/branches', name: 'branches', component: { template: '<div />' } },
      { path: '/dashboard/staff', name: 'staff', component: { template: '<div />' } },
      { path: '/dashboard/menu-items', name: 'menu-items', component: { template: '<div />' } },
    ],
  })
}

function mountSidebar(router) {
  return mount(AppSidebar, {
    global: { plugins: [router] },
  })
}

const menuItemsLink = (wrapper) => wrapper.find('a[href="/dashboard/menu-items"]')

describe('AppSidebar', () => {
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
    router = createRouterStub()
    await router.push('/dashboard')
    await router.isReady()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([['admin'], ['manager']])('shows the Menu Items link for %s', async (role) => {
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'Test', roles: [role] }

    const wrapper = mountSidebar(router)

    expect(menuItemsLink(wrapper).exists()).toBe(true)
    expect(menuItemsLink(wrapper).text()).toContain('Menu Items')
  })

  it.each([['cashier'], ['kitchen']])('hides the Menu Items link for %s', async (role) => {
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'Test', roles: [role] }

    const wrapper = mountSidebar(router)

    expect(menuItemsLink(wrapper).exists()).toBe(false)
  })
})