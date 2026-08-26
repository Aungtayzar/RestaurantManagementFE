import apiClient from './client'

export async function getStaff({ page = 1, search, role, branch_id } = {}) {
  const response = await apiClient.get('/staff', { params: { page, search, role, branch_id } })
  return response.data
}

export async function getStaffMember(id) {
  const response = await apiClient.get(`/staff/${id}`)
  return response.data
}

export async function createStaff(payload) {
  const response = await apiClient.post('/staff', payload)
  return response.data
}

export async function updateStaff(id, payload) {
  const response = await apiClient.patch(`/staff/${id}`, payload)
  return response.data
}
