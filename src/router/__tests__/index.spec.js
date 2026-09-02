import { describe, expect, it, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import router from '../index'
import { useAuthStore } from '@/stores/auth'

// Warm the lazy-loaded route components so guard tests do not hit vitest's default timeout.
await Promise.all([
  import('@/views/auth/EntryView.vue'),
  import('@/views/staff/StaffListView.vue'),
  import('@/views/branches/BranchesView.vue'),
  import('@/views/menu/MenuItemsView.vue'),
])

function authenticate({ roles }) {
  const auth = useAuthStore()
  auth.token = 'test-token'
  auth.user = { id: 1, name: 'Test User', roles }
}

describe('router role guards', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.token = null
    auth.user = null
    await router.push('/')
  })

  it.each([
    ['/dashboard/staff', 'staff'],
    ['/dashboard/branches', 'branches'],
  ])('redirects guests away from %s to the login page', async (path) => {
    await router.push(path)
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('lets managers access the staff page', async () => {
    authenticate({ roles: ['manager'] })

    await router.push('/dashboard/staff')

    expect(router.currentRoute.value.name).toBe('staff')
  })

  it('lets admins access both the staff and branches pages', async () => {
    authenticate({ roles: ['admin'] })

    await router.push('/dashboard/staff')
    expect(router.currentRoute.value.name).toBe('staff')

    await router.push('/dashboard/branches')
    expect(router.currentRoute.value.name).toBe('branches')
  })

  it('redirects cashiers away from the staff page', async () => {
    authenticate({ roles: ['cashier'] })

    await router.push('/dashboard/staff')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('redirects managers away from the branches page', async () => {
    authenticate({ roles: ['manager'] })

    await router.push('/dashboard/branches')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('redirects guests away from the menu-items page to the login page', async () => {
    await router.push('/dashboard/menu-items')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('lets admins access the menu-items page', async () => {
    authenticate({ roles: ['admin'] })

    await router.push('/dashboard/menu-items')

    expect(router.currentRoute.value.name).toBe('menu-items')
  })

  it('lets managers access the menu-items page', async () => {
    authenticate({ roles: ['manager'] })

    await router.push('/dashboard/menu-items')

    expect(router.currentRoute.value.name).toBe('menu-items')
  })

  it('redirects cashiers away from the menu-items page', async () => {
    authenticate({ roles: ['cashier'] })

    await router.push('/dashboard/menu-items')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('redirects kitchen users away from the menu-items page', async () => {
    authenticate({ roles: ['kitchen'] })

    await router.push('/dashboard/menu-items')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})

describe('router guest guard', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.token = null
    auth.user = null
    await router.push('/')
  })

  it('lets guests reach the public entry page', async () => {
    await router.push('/')

    expect(router.currentRoute.value.name).toBe('entry')
    expect(router.currentRoute.value.meta.requiresGuest).toBe(true)
  })

  it('redirects authenticated users away from the entry page to the dashboard', async () => {
    authenticate({ roles: ['admin'] })
    await router.push('/dashboard')

    await router.push('/')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('redirects authenticated users away from the login page to the dashboard', async () => {
    authenticate({ roles: ['admin'] })

    await router.push('/login')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('redirects authenticated users away from the forgot-password page to the dashboard', async () => {
    authenticate({ roles: ['admin'] })

    await router.push('/forgot-password')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})
