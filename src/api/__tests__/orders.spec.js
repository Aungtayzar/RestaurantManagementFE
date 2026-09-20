import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

import client from '@/api/client'
import { getOrder, getOrders, payOrder } from '../orders'

describe('orders api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists orders with filters', async () => {
    client.get.mockResolvedValue({ data: { data: [], summary: {} } })
    expect(await getOrders({ branch_id: 2, status: 'ready', page: 1 })).toEqual({
      data: [],
      summary: {},
    })
    expect(client.get).toHaveBeenCalledWith('/orders', {
      params: { branch_id: 2, status: 'ready', page: 1 },
    })
  })

  it('loads one order', async () => {
    client.get.mockResolvedValue({ data: { data: { id: 4 } } })
    expect(await getOrder(4)).toEqual({ data: { id: 4 } })
    expect(client.get).toHaveBeenCalledWith('/orders/4')
  })

  it('pays an order', async () => {
    const payload = { payment_method: 'cash', amount_received: '50.00' }
    client.post.mockResolvedValue({ data: { data: { id: 6 } } })
    expect(await payOrder(6, payload)).toEqual({ data: { id: 6 } })
    expect(client.post).toHaveBeenCalledWith('/orders/6/payment', payload)
  })
})
