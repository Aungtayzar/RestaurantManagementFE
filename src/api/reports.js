import apiClient from './client'

export async function getKitchenReport({ from, to, branch_id, item_limit = 10 }) {
  const response = await apiClient.get('/reports/kitchen', {
    params: { from, to, branch_id, item_limit },
  })
  return response.data
}

export async function getPaymentReport(params = {}) {
  const response = await apiClient.get('/reports/payments', { params })
  return response.data
}

export async function getPaymentReceipt(id) {
  const response = await apiClient.get(`/reports/payments/${id}`)
  return response.data
}

export async function downloadPaymentReport(params, format) {
  let response
  try {
    response = await apiClient.get('/reports/payments/export', {
      params: { ...params, format },
      responseType: 'blob',
    })
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text())
      } catch {
        // Preserve the HTTP status when the server returns a non-JSON error.
      }
    }
    throw error
  }
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `payments-${params.from || 'today'}-${params.to || 'today'}.${format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
