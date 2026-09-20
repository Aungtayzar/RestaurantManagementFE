import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

import client from '@/api/client'
import { createOrder, getMenu } from '../pos'

describe('pos api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the menu for a branch', async () => {
    client.get.mockResolvedValue({ data: { data: [] } })
    expect(await getMenu({ branch_id: 2 })).toEqual({ data: [] })
    expect(client.get).toHaveBeenCalledWith('/menu', { params: { branch_id: 2 } })
  })

  it('creates an order', async () => {
    const payload = { type: 'takeaway', branch_id: 1, items: [] }
    client.post.mockResolvedValue({ data: { data: { id: 9 } } })
    expect(await createOrder(payload, 'key-1')).toEqual({ data: { id: 9 } })
    expect(client.post).toHaveBeenCalledWith('/orders', payload, {
      headers: { 'Idempotency-Key': 'key-1' },
    })
  })
})
