import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: 'http://localhost:8000/api' },
  },
}))

import apiClient from '@/api/client'
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getImageUrl,
} from '@/api/menuItems'

describe('menuItems API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMenuItems', () => {
    it('sends GET /menu-items with no params when called with no args', async () => {
      const payload = { data: [], meta: {} }
      apiClient.get.mockResolvedValueOnce({ data: payload })

      const result = await getMenuItems()

      expect(apiClient.get).toHaveBeenCalledWith('/menu-items', { params: {} })
      expect(result).toEqual(payload)
    })

    it('passes query params for search, category_id, available', async () => {
      const payload = { data: [] }
      apiClient.get.mockResolvedValueOnce({ data: payload })

      await getMenuItems({ search: 'pizza', category_id: 3, available: true })

      expect(apiClient.get).toHaveBeenCalledWith('/menu-items', {
        params: { search: 'pizza', category_id: 3, available: true },
      })
    })

    it('omits undefined params', async () => {
      apiClient.get.mockResolvedValueOnce({ data: {} })

      await getMenuItems({ search: 'burger', category_id: undefined, available: undefined })

      expect(apiClient.get).toHaveBeenCalledWith('/menu-items', {
        params: { search: 'burger' },
      })
    })
  })

  describe('getMenuItem', () => {
    it('sends GET /menu-items/:id and returns data', async () => {
      const payload = { id: 5, name: 'Caesar Salad' }
      apiClient.get.mockResolvedValueOnce({ data: payload })

      const result = await getMenuItem(5)

      expect(apiClient.get).toHaveBeenCalledWith('/menu-items/5')
      expect(result).toEqual(payload)
    })
  })

  describe('createMenuItem', () => {
    it('sends POST /menu-items with FormData content type', async () => {
      const payload = { id: 10, name: 'New Item' }
      apiClient.post.mockResolvedValueOnce({ data: payload })
      const formData = new FormData()
      formData.append('name', 'New Item')

      const result = await createMenuItem(formData)

      expect(apiClient.post).toHaveBeenCalledWith('/menu-items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      expect(result).toEqual(payload)
    })
  })

  describe('updateMenuItem', () => {
    it('sends POST /menu-items/:id with FormData content type', async () => {
      const payload = { id: 10, name: 'Updated Item' }
      apiClient.post.mockResolvedValueOnce({ data: payload })
      const formData = new FormData()
      formData.append('name', 'Updated Item')

      const result = await updateMenuItem(10, formData)

      expect(apiClient.post).toHaveBeenCalledWith('/menu-items/10', formData)
      expect(result).toEqual(payload)
    })
  })

  describe('deleteMenuItem', () => {
    it('sends DELETE /menu-items/:id and returns data', async () => {
      const payload = { message: 'Deleted' }
      apiClient.delete.mockResolvedValueOnce({ data: payload })

      const result = await deleteMenuItem(7)

      expect(apiClient.delete).toHaveBeenCalledWith('/menu-items/7')
      expect(result).toEqual(payload)
    })
  })

  describe('getImageUrl', () => {
    it('returns full URL by stripping /api from base and prepending /storage/', () => {
      const result = getImageUrl('menu-items/photo.jpg')
      expect(result).toBe('http://localhost:8000/storage/menu-items/photo.jpg')
    })

    it('returns empty string for falsy path', () => {
      expect(getImageUrl('')).toBe('')
      expect(getImageUrl(null)).toBe('')
      expect(getImageUrl(undefined)).toBe('')
    })
  })
})
