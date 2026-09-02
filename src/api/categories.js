import apiClient from './client'

export async function getCategories({ page = 1, per_page = 100 } = {}) {
  const response = await apiClient.get('/categories', { params: { page, per_page } })
  return response.data
}
