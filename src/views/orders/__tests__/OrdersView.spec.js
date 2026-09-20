import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/orders', () => ({ getOrders: vi.fn(), getOrder: vi.fn(), payOrder: vi.fn() }))
vi.mock('@/api/branches', () => ({ getBranches: vi.fn() }))
vi.mock('vue3-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { getOrders } from '@/api/orders'
import { useAuthStore } from '@/stores/auth'
import OrdersView from '../OrdersView.vue'

const readyOrder = {
  id: 6,
  order_number: 'B001-6',
  type: 'dine_in',
  status: 'ready',
  table: { id: 1, name: 'Dining 01' },
  items: [{ id: 1, item_name: 'Burger', variant_name: null, quantity: 2, notes: null }],
  total: '20.00',
  created_at: '2026-09-20T14:02:11+00:00',
}
const pendingOrder = { ...readyOrder, id: 7, order_number: 'B001-7', status: 'pending' }

describe('OrdersView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    useAuthStore().user = { id: 1, roles: ['cashier'] }
  })

  it('loads the ready tab by default for non-admins without branch_id', async () => {
    getOrders.mockResolvedValue({
      data: [readyOrder],
      meta: { current_page: 1, last_page: 1 },
      summary: { ready: 1, pending: 0, preparing: 0, completed: 0 },
    })
    const wrapper = mount(OrdersView)
    await flushPromises()
    expect(getOrders).toHaveBeenCalledWith({ branch_id: undefined, status: 'ready', page: 1 })
    expect(wrapper.text()).toContain('B001-6')
    expect(wrapper.text()).toContain('2× Burger')
  })

  it('only offers Pay on ready orders', async () => {
    getOrders.mockResolvedValue({
      data: [readyOrder, pendingOrder],
      meta: { current_page: 1, last_page: 1 },
      summary: null,
    })
    const wrapper = mount(OrdersView)
    await flushPromises()
    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Pay')
    expect(rows[1].text()).not.toContain('Pay')
  })

  it('reloads with the selected status tab', async () => {
    getOrders.mockResolvedValue({ data: [], meta: null, summary: null })
    const wrapper = mount(OrdersView)
    await flushPromises()
    await wrapper
      .findAll('[role="tab"]')
      .find((t) => t.text().includes('Pending'))
      .trigger('click')
    await flushPromises()
    expect(getOrders).toHaveBeenLastCalledWith({ branch_id: undefined, status: 'pending', page: 1 })
  })
})
