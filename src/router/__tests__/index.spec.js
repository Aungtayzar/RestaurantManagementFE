import { describe, expect, it, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import router from '../index'
import { useAuthStore } from '@/stores/auth'

// Warm the lazy-loaded route components so guard tests do not hit vitest's default timeout.
await Promise.all([
  import('@/views/staff/StaffListView.vue'),
  import('@/views/branches/BranchesView.vue'),
])

function authenticate({ roles }) {
  const auth = useAuthStore()
  auth.token = 'test-token'
  auth.user = { id: 1, name: 'Test User', roles }
}

describe('router role guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.token = null
    auth.user = null
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
})
