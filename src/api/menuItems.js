import apiClient from './client'

export async function getMenuItems({ search, category_id, available } = {}) {
  const params = {}
  if (search !== undefined) params.search = search
  if (category_id !== undefined) params.category_id = category_id
  if (available !== undefined) params.available = available
  const response = await apiClient.get('/menu-items', { params })
  return response.data
}

export async function getMenuItem(id) {
  const response = await apiClient.get(`/menu-items/${id}`)
  return response.data
}

export async function createMenuItem(formData) {
  const response = await apiClient.post('/menu-items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function updateMenuItem(id, formData) {
  formData.append('_method', 'PATCH')

  const response = await apiClient.post(`/menu-items/${id}`, formData)

  return response.data
}

export async function deleteMenuItem(id) {
  const response = await apiClient.delete(`/menu-items/${id}`)
  return response.data
}

export function getImageUrl(path) {
  if (!path) return ''
  const baseUrl = apiClient.defaults.baseURL.replace('/api', '')
  return `${baseUrl}/storage/${path}`
}
