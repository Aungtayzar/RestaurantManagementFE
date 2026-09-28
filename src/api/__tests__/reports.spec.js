import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({ default: { get: vi.fn() } }))

import client from '@/api/client'
import { getKitchenReport } from '../reports'

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
