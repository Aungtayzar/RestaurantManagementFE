import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

import EntryView from '../EntryView.vue'

function createRouterWith() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'entry', component: EntryView },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
      {
        path: '/forgot-password',
        name: 'forgot-password',
        component: { template: '<div>Forgot</div>' },
      },
    ],
  })
}

describe('EntryView (login entry link)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  async function mountView() {
    const router = createRouterWith()
    router.push('/')
    await router.isReady()

    const wrapper = mount(EntryView, {
      global: { plugins: [router] },
    })
    return { wrapper, router }
  }

  it('shows a "Sign in" link to the login route', async () => {
    const { wrapper } = await mountView()

    const signIn = wrapper.find('a[href="/login"]')
    expect(signIn.exists()).toBe(true)
    expect(signIn.text()).toContain('Sign in')
  })

  it('shows a "Forgot password?" link to the forgot-password route', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.find('a[href="/forgot-password"]').exists()).toBe(true)
  })

  it('displays the product name', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.text()).toContain('Restaurant Management System')
  })
})
