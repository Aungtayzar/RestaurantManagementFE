import apiClient from './client'

export async function getMenu({ branch_id } = {}) {
  const response = await apiClient.get('/menu', { params: { branch_id } })
  return response.data
}

export async function createOrder(payload, idempotencyKey) {
  const response = await apiClient.post('/orders', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return response.data
}
