import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

import apiClient from '@/api/client'
import { createCategory, getCategories, updateCategory } from '@/api/categories'

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

  it('creates a category with form data', async () => {
    const formData = new FormData()
    formData.append('name', 'Soups')
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 6, name: 'Soups' } } })

    const result = await createCategory(formData)

    expect(apiClient.post).toHaveBeenCalledWith('/categories', formData)
    expect(result.data.name).toBe('Soups')
  })

  it('updates a category through the multipart PATCH override', async () => {
    const formData = new FormData()
    formData.append('name', 'Hot Soups')
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 6, name: 'Hot Soups' } } })

    await updateCategory(6, formData)

    expect(formData.get('_method')).toBe('PATCH')
    expect(apiClient.post).toHaveBeenCalledWith('/categories/6', formData)
  })
})
