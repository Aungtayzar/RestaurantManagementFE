import apiClient from './client'

export async function getStaff({ page = 1, search, role, branch_id } = {}) {
  const response = await apiClient.get('/staff', { params: { page, search, role, branch_id } })
  return response.data
}
