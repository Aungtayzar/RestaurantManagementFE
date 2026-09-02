import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
}))

import apiClient from '@/api/client'
import { getCategories } from '@/api/categories'

describe('categories API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategories', () => {
    it('sends GET /categories with default params and returns data', async () => {
      const payload = { data: [{ id: 1, name: 'Drinks' }] }
      apiClient.get.mockResolvedValueOnce({ data: payload })

      const result = await getCategories()

      expect(apiClient.get).toHaveBeenCalledWith('/categories', {
        params: { page: 1, per_page: 100 },
      })
      expect(result).toEqual(payload)
    })

    it('passes custom page and per_page params', async () => {
      const payload = { data: [] }
      apiClient.get.mockResolvedValueOnce({ data: payload })

      const result = await getCategories({ page: 2, per_page: 50 })

      expect(apiClient.get).toHaveBeenCalledWith('/categories', {
        params: { page: 2, per_page: 50 },
      })
      expect(result).toEqual(payload)
    })
  })
})
