import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue3-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/api/pos', () => ({ getMenu: vi.fn(), createOrder: vi.fn() }))
vi.mock('@/api/tables', () => ({ getTables: vi.fn() }))
vi.mock('@/api/branches', () => ({ getBranches: vi.fn() }))

import { createOrder, getMenu } from '@/api/pos'
import { getTables } from '@/api/tables'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import PosView from '../PosView.vue'

const menu = {
  data: [
    {
      id: 3,
      name: 'Desserts',
      items: [
        {
          id: 4,
          name: 'Lava Cake',
          base_price: '6.99',
          is_available: true,
          variants: [{ id: 8, name: 'Single', price: '6.99' }],
        },
        { id: 5, name: 'Hidden', base_price: '1.00', is_available: false, variants: [] },
      ],
    },
  ],
}

function setup(user) {
  setActivePinia(createPinia())
  useAuthStore().user = user
  return mount(PosView)
}

describe('PosView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMenu.mockResolvedValue(menu)
    getTables.mockResolvedValue({
      data: [{ id: 5, name: 'T5', capacity: 4, is_active: true, status: 'available' }],
    })
    createOrder.mockResolvedValue({ data: { id: 1 } })
  })

  async function fillOrder(wrapper) {
    await wrapper.find('button.cursor-pointer.flex-col').trigger('click')
    await flushPromises()
    const variant = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Single'),
    )
    variant.click()
    await flushPromises()
    const table = wrapper.findAll('button').find((b) => b.text().includes('T5'))
    await table.trigger('click')
  }
  async function placeOrder(wrapper) {
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Place order'))
      .trigger('click')
    await flushPromises()
  }

  it('places a dine-in order for a cashier', async () => {
    const wrapper = setup({ id: 1, roles: ['cashier'], branch: { id: 1 } })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Hidden')

    await fillOrder(wrapper)
    await placeOrder(wrapper)

    expect(createOrder).toHaveBeenCalledWith(
      {
        type: 'dine_in',
        branch_id: 1,
        table_id: 5,
        items: [{ menu_item_id: 4, variant_id: 8, quantity: 1, notes: undefined }],
      },
      expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/),
    )
  })

  it('reuses the idempotency key when retrying a failed order', async () => {
    createOrder.mockRejectedValueOnce(new Error('network'))
    const wrapper = setup({ id: 1, roles: ['cashier'], branch: { id: 1 } })
    await flushPromises()
    await fillOrder(wrapper)
    await placeOrder(wrapper)
    await placeOrder(wrapper)

    const [first, second] = createOrder.mock.calls.map(([, key]) => key)
    expect(second).toBe(first)
  })

  it('uses a new idempotency key for the next order', async () => {
    const wrapper = setup({ id: 1, roles: ['cashier'], branch: { id: 1 } })
    await flushPromises()
    await fillOrder(wrapper)
    await placeOrder(wrapper)
    await fillOrder(wrapper)
    await placeOrder(wrapper)

    const [first, second] = createOrder.mock.calls.map(([, key]) => key)
    expect(second).not.toBe(first)
  })

  it('makes admins pick a branch before loading the menu', async () => {
    getBranches.mockResolvedValue({ data: [{ id: 2, name: 'Downtown' }], meta: { last_page: 1 } })
    const wrapper = setup({ id: 9, roles: ['admin'] })
    await flushPromises()
    expect(getMenu).not.toHaveBeenCalled()

    await wrapper.find('select').setValue('2')
    await flushPromises()
    expect(getMenu).toHaveBeenCalledWith({ branch_id: 2 })
  })
})
