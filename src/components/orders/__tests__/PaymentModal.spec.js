import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/api/orders', () => ({ payOrder: vi.fn() }))

import { payOrder } from '@/api/orders'
import PaymentModal from '../PaymentModal.vue'

const order = { id: 6, order_number: 'B001-6', total: '17.48' }

async function mountModal() {
  const wrapper = mount(PaymentModal, { props: { order }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('PaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('prefills the exact total and shows zero change', async () => {
    await mountModal()
    expect(document.querySelector('#amount-received').value).toBe('17.48')
    expect(document.body.textContent).toContain('0.00')
  })

  it('blocks submit when the amount is short', async () => {
    const wrapper = await mountModal()
    const input = document.querySelector('#amount-received')
    input.value = '10'
    input.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('Amount is too low')
    const submit = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Confirm payment'),
    )
    expect(submit.disabled).toBe(true)
  })

  it('sends a cash payment payload and emits paid', async () => {
    payOrder.mockResolvedValue({ data: { id: 6 } })
    const wrapper = await mountModal()
    const input = document.querySelector('#amount-received')
    input.value = '50'
    input.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()
    document.querySelector('form').dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(payOrder).toHaveBeenCalledWith(6, { payment_method: 'cash', amount_received: '50.00' })
    expect(wrapper.emitted('paid')).toBeTruthy()
  })

  it('shows the server error and asks for a refresh on 422', async () => {
    payOrder.mockRejectedValue({
      response: { status: 422, data: { message: 'Order is not ready.' } },
    })
    const wrapper = await mountModal()
    document.querySelector('form').dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(document.body.textContent).toContain('Order is not ready.')
    expect(wrapper.emitted('stale')).toBeTruthy()
  })
})
