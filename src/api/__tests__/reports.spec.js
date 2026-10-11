import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({ default: { get: vi.fn() } }))

import client from '@/api/client'
import {
  getKitchenReport,
  getPaymentReport,
  getPaymentReceipt,
  downloadPaymentReport,
} from '../reports'

describe('kitchen report API', () => {
  it('passes dates and branch filters to the report endpoint', async () => {
    client.get.mockResolvedValue({ data: { data: { summary: {} } } })
    expect(await getKitchenReport({ from: '2026-09-01', to: '2026-09-23', branch_id: 1 })).toEqual({
      data: { summary: {} },
    })
    expect(client.get).toHaveBeenCalledWith('/reports/kitchen', {
      params: { from: '2026-09-01', to: '2026-09-23', branch_id: 1, item_limit: 10 },
    })
  })
})

describe('payment report API', () => {
  afterEach(() => vi.restoreAllMocks())

  it('passes the selected filters to reports and uses the scoped receipt endpoint', async () => {
    client.get.mockResolvedValue({ data: { data: { summary: {} } } })
    const params = {
      from: '2026-10-01',
      to: '2026-10-03',
      branch_id: 1,
      cashier_id: 8,
      type: 'dine_in',
      q: 'ORDER',
      page: 2,
    }
    await getPaymentReport(params)
    expect(client.get).toHaveBeenLastCalledWith('/reports/payments', { params })
    await getPaymentReceipt(6)
    expect(client.get).toHaveBeenLastCalledWith('/reports/payments/6')
  })

  it('downloads the export response as a file and releases the object URL', async () => {
    const blob = new Blob(['csv data'])
    client.get.mockResolvedValue({ data: blob })
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:payment-report')
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const params = { from: '2026-10-01', to: '2026-10-03', type: 'takeaway' }

    await downloadPaymentReport(params, 'xlsx')

    expect(client.get).toHaveBeenLastCalledWith('/reports/payments/export', {
      params: { ...params, format: 'xlsx' },
      responseType: 'blob',
    })
    expect(createUrl).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalled()
    expect(revokeUrl).toHaveBeenCalledWith('blob:payment-report')
  })
})
