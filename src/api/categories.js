import apiClient from './client'

export async function getCategories({ page = 1, per_page = 100 } = {}) {
  const response = await apiClient.get('/categories', { params: { page, per_page } })
  return response.data
}

export async function createCategory(formData) {
  const response = await apiClient.post('/categories', formData)
  return response.data
}

export async function updateCategory(id, formData) {
  formData.append('_method', 'PATCH')
  const response = await apiClient.post(`/categories/${id}`, formData)
  return response.data
}
