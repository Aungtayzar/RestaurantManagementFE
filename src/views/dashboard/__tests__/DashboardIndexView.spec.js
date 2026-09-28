import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/branches', () => ({ getBranches: vi.fn() }))
vi.mock('@/api/reports', () => ({ getKitchenReport: vi.fn() }))

import { getBranches } from '@/api/branches'
import { getKitchenReport } from '@/api/reports'
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

  it('requires admin branch selection and limits the date range', async () => {
    useAuthStore().user = { name: 'Admin', roles: ['admin'] }
    const wrapper = mount(DashboardIndexView)
    await flushPromises()
    expect(wrapper.find('header form select').exists()).toBe(true)
    expect(wrapper.find('header form input[type="date"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Kitchen operations')
    expect(getKitchenReport).not.toHaveBeenCalled()
    await wrapper.find('select').setValue('1')
    await wrapper.find('input[type="date"]').setValue('2026-01-01')
    expect(wrapper.text()).toContain('The report period may not exceed 90 days.')
    expect(getKitchenReport).not.toHaveBeenCalled()
    await wrapper.find('input[type="date"]').setValue('2026-09-01')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(getKitchenReport).toHaveBeenCalledWith(expect.objectContaining({ branch_id: 1 }))
    wrapper.unmount()
  })

  it('does not request reports for cashiers', async () => {
    useAuthStore().user = { name: 'Cashier', roles: ['cashier'] }
    const wrapper = mount(DashboardIndexView)
    await flushPromises()
    expect(getKitchenReport).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Kitchen operations')
    wrapper.unmount()
  })
})
