import apiClient from './client'

export async function getTables({ branch_id, include_inactive = false } = {}) {
  const response = await apiClient.get('/tables', {
    params: { branch_id, include_inactive: include_inactive ? 1 : undefined },
  })
  return response.data
}

export async function createTable(payload) {
  return (await apiClient.post('/tables', payload)).data
}

export async function updateTable(id, payload) {
  return (await apiClient.patch(`/tables/${id}`, payload)).data
}

export async function deleteTable(id) {
  await apiClient.delete(`/tables/${id}`)
}
