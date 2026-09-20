import apiClient from './client'

export async function getOrders({ branch_id, status, page } = {}) {
  const response = await apiClient.get('/orders', { params: { branch_id, status, page } })
  return response.data
}

export async function getOrder(id) {
  const response = await apiClient.get(`/orders/${id}`)
  return response.data
}

export async function payOrder(id, payload) {
  const response = await apiClient.post(`/orders/${id}/payment`, payload)
  return response.data
}
