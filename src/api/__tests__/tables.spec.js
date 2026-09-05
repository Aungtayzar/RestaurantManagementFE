import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
import client from '@/api/client'
import { getTables, createTable, updateTable, deleteTable } from '../tables'

describe('tables API', () => {
  beforeEach(() => vi.clearAllMocks())
  it('sends an admin branch and Laravel-compatible inactive flag', async () => {
    client.get.mockResolvedValue({ data: { data: [], summary: { available: 0, occupied: 0 } } })
    expect(await getTables({ branch_id: 2, include_inactive: true })).toEqual({
      data: [],
      summary: { available: 0, occupied: 0 },
    })
    expect(client.get).toHaveBeenCalledWith('/tables', {
      params: { branch_id: 2, include_inactive: 1 },
    })
    await getTables()
    expect(client.get).toHaveBeenLastCalledWith('/tables', {
      params: { branch_id: undefined, include_inactive: undefined },
    })
  })
  it('uses POST, PATCH and DELETE with no response body required for deletion', async () => {
    const payload = { name: 'T01', capacity: 10, display_order: 1, is_active: true }
    client.post.mockResolvedValue({ data: { data: { id: 4, ...payload } } })
    client.patch.mockResolvedValue({ data: { data: { id: 4, ...payload } } })
    client.delete.mockResolvedValue({ status: 204 })
    await createTable(payload)
    await updateTable(4, payload)
    await deleteTable(4)
    expect(client.post).toHaveBeenCalledWith('/tables', payload)
    expect(client.patch).toHaveBeenCalledWith('/tables/4', payload)
    expect(client.delete).toHaveBeenCalledWith('/tables/4')
  })
})
