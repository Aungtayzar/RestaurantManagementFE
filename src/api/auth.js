import apiClient from './client'

export async function login({ email, password }) {
  const response = await apiClient.post('/login', { email, password })
  return response.data
}

export async function logout() {
  return apiClient.post('/logout')
}
