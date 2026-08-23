import apiClient from './client'

export async function getBranches({ page = 1 } = {}) {
  const response = await apiClient.get('/branches', { params: { page } })
  return response.data
}

export async function getBranch(id) {
  const response = await apiClient.get(`/branches/${id}`)
  return response.data
}

export async function createBranch(payload) {
  const response = await apiClient.post('/branches', payload)
  return response.data
}

export async function updateBranch(id, payload) {
  const response = await apiClient.patch(`/branches/${id}`, payload)
  return response.data
}
