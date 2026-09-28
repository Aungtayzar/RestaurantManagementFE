import apiClient from './client'

export async function getKitchenReport({ from, to, branch_id, item_limit = 10 }) {
  const response = await apiClient.get('/reports/kitchen', {
    params: { from, to, branch_id, item_limit },
  })
  return response.data
}
