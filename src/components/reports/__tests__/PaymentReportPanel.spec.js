import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/reports', () => ({
  getPaymentReport: vi.fn(),
  getPaymentReceipt: vi.fn(),
  downloadPaymentReport: vi.fn(),
}))
vi.mock('@/api/branches', () => ({ getBranches: vi.fn() }))

import { getPaymentReport, getPaymentReceipt, downloadPaymentReport } from '@/api/reports'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import PaymentReportPanel from '../PaymentReportPanel.vue'

const report = {
  period: { today: true, from: null, to: null },
  summary: {
    total_collected: '230.00',
    dine_in_total: '115.00',
    takeaway_total: '115.00',
    paid_order_count: 2,
    subtotal: '200.00',
    tax_amount: '10.00',
    service_charge_amount: '20.00',
  },
  branches: [
    {
      id: 1,
      name: 'HQ',
      timezone: 'Asia/Yangon',
      from: '2026-10-02',
      to: '2026-10-02',
      total_collected: '230.00',
      paid_order_count: 2,
      dine_in_total: '115.00',
      takeaway_total: '115.00',
    },
  ],
  daily: [{ date: '2026-10-02', total_collected: '230.00', paid_order_count: 2 }],
  cashiers: [{ id: 8, name: 'Payment Operator' }],
  transactions: [
    {
      id: 6,
      order_number: 'ORDER-6',
      branch: { name: 'HQ', timezone: 'Asia/Yangon' },
      cashier: { id: 8, name: 'Payment Operator' },
      type: 'dine_in',
      total: '115.00',
      amount_received: '200.00',
      change_amount: '85.00',
      paid_at: '2026-10-02T12:00:00+06:30',
    },
  ],
  meta: { current_page: 1, last_page: 2, total: 2 },
}

describe('payment report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    useAuthStore().user = { id: 8, roles: ['cashier'] }
    getPaymentReport.mockResolvedValue({ data: structuredClone(report) })
    getBranches.mockResolvedValue({ data: [{ id: 1, name: 'HQ' }], meta: { last_page: 1 } })
  })

  it('shows personal totals and transactions without cashier filters or exports', async () => {
    const wrapper = mount(PaymentReportPanel)
    await flushPromises()
    expect(wrapper.text()).toContain('Dine-in collected')
    expect(wrapper.text()).toContain('Takeaway collected')
    expect(wrapper.text()).toContain('230.00')
    expect(wrapper.text()).toContain('ORDER-6')
    expect(wrapper.text()).toContain('Your payments')
    expect(wrapper.find('[name="cashier_id"]').exists()).toBe(false)
    expect(wrapper.find('[name="branch_id"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Export CSV')
    wrapper.unmount()
  })

  it('applies admin filters to totals, pagination, and downloads', async () => {
    useAuthStore().user = { roles: ['admin'] }
    const wrapper = mount(PaymentReportPanel)
    await flushPromises()
    expect(wrapper.find('[name="branch_id"]').text()).toContain('All branches')
    await wrapper.find('[name="from"]').setValue('2026-10-01')
    await wrapper.find('[name="to"]').setValue('2026-10-03')
    await wrapper.find('[name="q"]').setValue('ORDER')
    await wrapper.find('[name="type"]').setValue('dine_in')
    await wrapper.find('[name="cashier_id"]').setValue('8')
    await flushPromises()
    const filters = {
      from: '2026-10-01',
      to: '2026-10-03',
      q: 'ORDER',
      type: 'dine_in',
      cashier_id: 8,
    }
    expect(getPaymentReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ ...filters, page: 1 }),
    )
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next')
      .trigger('click')
    await flushPromises()
    expect(getPaymentReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ ...filters, page: 2 }),
    )
    downloadPaymentReport.mockResolvedValue(undefined)
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Export CSV')
      .trigger('click')
    await flushPromises()
    expect(downloadPaymentReport).toHaveBeenCalledWith(expect.objectContaining(filters), 'csv')
    wrapper.unmount()
  })

  it('loads receipts through the payment report endpoint and shows payment details', async () => {
    getPaymentReceipt.mockResolvedValue({
      data: {
        id: 5,
        order_number: 'ORDER-6',
        type: 'dine_in',
        status: 'completed',
        branch: { name: 'HQ', timezone: 'Asia/Yangon' },
        table: { name: 'Table 1' },
        created_at: '2026-10-02T11:00:00+06:30',
        subtotal: '100.00',
        tax_amount: '5.00',
        service_charge_amount: '10.00',
        total: '115.00',
        items: [
          { id: 1, quantity: 1, item_name: 'Burger', unit_price: '100.00', line_total: '100.00' },
        ],
        payment: {
          amount_received: '200.00',
          change_amount: '85.00',
          paid_by: { name: 'Payment Operator' },
          paid_at: '2026-10-02T12:00:00+06:30',
          payment_method: 'cash',
        },
      },
    })
    const wrapper = mount(PaymentReportPanel, { attachTo: document.body })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'View receipt')
      .trigger('click')
    await flushPromises()
    expect(getPaymentReceipt).toHaveBeenCalledWith(6)
    expect(document.body.textContent).toContain('Cash received')
    expect(document.body.textContent).toContain('85.00')
    expect(document.body.textContent).toContain('Burger')
    wrapper.unmount()
  })

  it('shows forbidden errors and offers retry', async () => {
    getPaymentReport.mockRejectedValueOnce({ response: { status: 403 } })
    const wrapper = mount(PaymentReportPanel)
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('permission')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Retry')
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('230.00')
    wrapper.unmount()
  })

  it('allows annual payment report periods', async () => {
    const wrapper = mount(PaymentReportPanel)
    await flushPromises()
    await wrapper.find('[name="from"]').setValue('2026-01-01')
    await wrapper.find('[name="to"]').setValue('2026-12-31')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    await flushPromises()
    expect(getPaymentReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: '2026-01-01', to: '2026-12-31' }),
    )
    wrapper.unmount()
  })

  it('refreshes automatically when filters change', async () => {
    useAuthStore().user = { roles: ['manager'] }
    getPaymentReport.mockResolvedValueOnce({
      data: {
        ...structuredClone(report),
        summary: { ...report.summary, paid_order_count: 0, total_collected: '0.00' },
        daily: [{ date: '2026-10-02', total_collected: '0.00', paid_order_count: 0 }],
        transactions: [],
      },
    })
    const wrapper = mount(PaymentReportPanel)
    await flushPromises()
    expect(wrapper.text()).toContain('0.00')
    await wrapper.find('[name="q"]').setValue('OTHER')
    await new Promise((resolve) => setTimeout(resolve, 320))
    await flushPromises()
    expect(getPaymentReport).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'OTHER' }))
    wrapper.unmount()
  })

  it('ignores old responses when a newer filter request finishes first', async () => {
    let finishOld
    getPaymentReport.mockReturnValueOnce(
      new Promise((resolve) => {
        finishOld = resolve
      }),
    )
    const wrapper = mount(PaymentReportPanel)
    await wrapper.find('[name="from"]').setValue('2026-10-02')
    await wrapper.find('[name="to"]').setValue('2026-10-02')
    await wrapper.find('[name="q"]').setValue('NEW')
    await new Promise((resolve) => setTimeout(resolve, 320))
    await flushPromises()
    expect(wrapper.text()).toContain('230.00')
    finishOld({
      data: {
        ...structuredClone(report),
        summary: { ...report.summary, total_collected: '999.00' },
      },
    })
    await flushPromises()
    expect(wrapper.text()).not.toContain('999.00')
    wrapper.unmount()
  })

  it('reports an export permission error without losing the loaded report', async () => {
    useAuthStore().user = { roles: ['manager'] }
    downloadPaymentReport.mockRejectedValueOnce({ response: { status: 403 } })
    const wrapper = mount(PaymentReportPanel)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Export Excel')
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('permission')
    expect(wrapper.text()).toContain('230.00')
    wrapper.unmount()
  })
})
