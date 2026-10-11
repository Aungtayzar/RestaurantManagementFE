import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/branches', () => ({ getBranches: vi.fn() }))
vi.mock('@/api/reports', () => ({
  getKitchenReport: vi.fn(),
  getPaymentReport: vi.fn(),
  getPaymentReceipt: vi.fn(),
  downloadPaymentReport: vi.fn(),
}))

import { getBranches } from '@/api/branches'
import { getKitchenReport, getPaymentReport } from '@/api/reports'
import { useAuthStore } from '@/stores/auth'
import DashboardIndexView from '../DashboardIndexView.vue'

const report = {
  branch: { name: 'HQ Branch', timezone: 'Asia/Yangon' },
  period: { from: '2026-09-01', to: '2026-09-23' },
  summary: { orders_received: 2, orders_readied: 1 },
  live_active_orders: { pending: 1, preparing: 0, ready: 0, total: 1 },
  durations_seconds: {
    queue: { average: null, longest: null, sample_size: 0 },
    active_preparation: { average: null, longest: null, sample_size: 0 },
    total_kitchen: { average: null, longest: null, sample_size: 0 },
    excluded_orders: 1,
  },
  daily: [],
  prepared_items: [],
  employees: [],
}

describe('dashboard kitchen report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    getBranches.mockResolvedValue({ data: [{ id: 1, name: 'HQ Branch' }] })
    getKitchenReport.mockResolvedValue({ data: report })
    getPaymentReport.mockResolvedValue({
      data: {
        period: { today: true },
        summary: {
          total_collected: '230.00',
          dine_in_total: '115.00',
          takeaway_total: '115.00',
          paid_order_count: 2,
          subtotal: '200.00',
          tax_amount: '10.00',
          service_charge_amount: '20.00',
        },
        branches: [{ id: 1, name: 'HQ', from: '2026-10-02', to: '2026-10-02' }],
        cashiers: [],
      },
    })
  })

  it('loads the assigned branch report for managers', async () => {
    useAuthStore().user = { name: 'Manager', roles: ['manager'] }
    const wrapper = mount(DashboardIndexView)
    await flushPromises()
    expect(getKitchenReport).toHaveBeenCalledWith(expect.objectContaining({ branch_id: undefined }))
    expect(wrapper.text()).toContain('Orders received')
    expect(wrapper.text()).toContain('Live order flow')
    expect(wrapper.text()).toContain('No daily activity in this period.')
    expect(wrapper.text()).toContain('No prepared items in this period.')
    wrapper.unmount()
  })

  it('refreshes when filters change and keeps the kitchen report visible while a request is pending', async () => {
    useAuthStore().user = { name: 'Admin', roles: ['admin'] }
    const wrapper = mount(DashboardIndexView)
    await flushPromises()
    expect(wrapper.find('header select').exists()).toBe(true)
    expect(wrapper.find('header input[type="date"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Apply')
    expect(wrapper.text()).toContain('Orders received')

    let resolveReport
    getKitchenReport.mockImplementationOnce(() => new Promise((resolve) => { resolveReport = resolve }))
    await wrapper.find('select').setValue('1')
    await flushPromises()
    expect(getKitchenReport).toHaveBeenLastCalledWith(expect.objectContaining({ branch_id: 1 }))
    expect(wrapper.text()).toContain('Orders received')
    resolveReport({ data: { ...report, branch: { ...report.branch, name: 'Selected Branch' } } })
    await flushPromises()
    expect(wrapper.text()).toContain('Selected Branch')

    const callCount = getKitchenReport.mock.calls.length
    await wrapper.find('input[type="date"]').setValue('2026-01-01')
    expect(wrapper.text()).toContain('The report period may not exceed 90 days.')
    expect(getKitchenReport).toHaveBeenCalledTimes(callCount)
    expect(wrapper.text()).toContain('Selected Branch')
    await wrapper.find('input[type="date"]').setValue('2026-09-01')
    await flushPromises()
    expect(getKitchenReport).toHaveBeenLastCalledWith(expect.objectContaining({ branch_id: 1, from: '2026-09-01' }))
    wrapper.unmount()
  })

  it('shows today’s personal payment totals for cashiers without kitchen reports', async () => {
    useAuthStore().user = { name: 'Cashier', roles: ['cashier'] }
    const wrapper = mount(DashboardIndexView)
    await flushPromises()
    expect(getKitchenReport).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Kitchen operations')
    expect(getPaymentReport).toHaveBeenCalledWith({
      from: expect.any(String),
      to: expect.any(String),
      per_page: 1,
    })
    expect(wrapper.text()).toContain('Dine-in collected')
    expect(wrapper.text()).toContain('Takeaway collected')
    expect(wrapper.text()).toContain('230.00')
    wrapper.unmount()
  })

  it('shows payment summary skeleton cards while payment data loads', async () => {
    useAuthStore().user = { name: 'Cashier', roles: ['cashier'] }
    let resolvePayment
    getPaymentReport.mockImplementationOnce(() => new Promise((resolve) => { resolvePayment = resolve }))
    const wrapper = mount(DashboardIndexView)

    const status = wrapper.find('[aria-label="Loading payment overview"]')
    expect(status.exists()).toBe(true)
    expect(status.findAll('[aria-hidden="true"] > div')).toHaveLength(7)
    expect(wrapper.text()).not.toContain('Dine-in collected')

    resolvePayment({
      data: {
        summary: {
          total_collected: '230.00',
          dine_in_total: '115.00',
          takeaway_total: '115.00',
          paid_order_count: 2,
          subtotal: '200.00',
          tax_amount: '10.00',
          service_charge_amount: '20.00',
        },
      },
    })
    await flushPromises()
    expect(wrapper.find('[aria-label="Loading payment overview"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Total collected')
    wrapper.unmount()
  })
})
