import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/orders', () => ({ getOrders: vi.fn(), updateOrderStatus: vi.fn() }))
vi.mock('@/api/branches', () => ({ getBranches: vi.fn() }))
vi.mock('vue3-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { getOrders, updateOrderStatus } from '@/api/orders'
import { useAuthStore } from '@/stores/auth'
import KitchenDisplayView from '../KitchenDisplayView.vue'

const pendingOrder = {
  id: 4,
  order_number: 'B001-4',
  type: 'takeaway',
  status: 'pending',
  table: null,
  items: [
    {
      id: 2,
      item_name: 'Chocolate Lava Cake',
      variant_name: 'Single Serving',
      quantity: 2,
      notes: 'No onions',
    },
  ],
  created_at: '2026-09-17T16:15:19+00:00',
}

const preparingOrder = {
  ...pendingOrder,
  id: 7,
  order_number: 'B001-7',
  type: 'dine_in',
  status: 'preparing',
  table: { id: 6, name: 'Dining 02' },
}

function mockOrderLists(pending = [pendingOrder], preparing = [preparingOrder]) {
  getOrders.mockImplementation(({ status }) =>
    Promise.resolve({ data: status === 'pending' ? pending : preparing }),
  )
}

describe('KitchenDisplayView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.user = { id: 2, roles: ['kitchen'], branch: { id: 1, name: 'HQ Branch' } }
    mockOrderLists()
  })

  it('loads pending and preparing tickets for the assigned branch', async () => {
    const wrapper = mount(KitchenDisplayView)
    await flushPromises()

    expect(getOrders).toHaveBeenCalledWith({ branch_id: undefined, status: 'pending', page: 1 })
    expect(getOrders).toHaveBeenCalledWith({ branch_id: undefined, status: 'preparing', page: 1 })
    expect(wrapper.text()).toContain('B001-4')
    expect(wrapper.text()).toContain('No onions')
    expect(wrapper.text()).toContain('Dining 02')
    wrapper.unmount()
  })

  it('does not poll the orders API', async () => {
    vi.useFakeTimers()
    const wrapper = mount(KitchenDisplayView)
    await flushPromises()

    expect(getOrders).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(30000)
    await flushPromises()
    expect(getOrders).toHaveBeenCalledTimes(2)

    wrapper.unmount()
    vi.useRealTimers()
  })

  it('moves a pending ticket into preparing after a successful update', async () => {
    updateOrderStatus.mockResolvedValue({
      data: { ...pendingOrder, status: 'preparing', updated_at: '2026-09-21T21:14:03+06:30' },
    })
    const wrapper = mount(KitchenDisplayView)
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Start preparing')
      .trigger('click')
    await flushPromises()

    expect(updateOrderStatus).toHaveBeenCalledWith(4, 'preparing')
    expect(wrapper.text()).not.toContain('Start preparing')
    expect(
      wrapper.findAll('button').filter((button) => button.text() === 'Mark as ready'),
    ).toHaveLength(2)
    wrapper.unmount()
  })

  it('removes a prepared ticket after marking it ready', async () => {
    updateOrderStatus.mockResolvedValue({ data: { ...preparingOrder, status: 'ready' } })
    const wrapper = mount(KitchenDisplayView)
    await flushPromises()

    const readyButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Mark as ready')
    await readyButton.trigger('click')
    await flushPromises()

    expect(updateOrderStatus).toHaveBeenCalledWith(7, 'ready')
    expect(wrapper.text()).not.toContain('B001-7')
    wrapper.unmount()
  })
})
