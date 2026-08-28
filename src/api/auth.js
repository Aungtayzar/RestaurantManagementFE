import apiClient from './client'

export async function login({ email, password }) {
  const response = await apiClient.post('/login', { email, password })
  return response.data
}

export async function logout() {
  return apiClient.post('/logout')
}

export async function forgotPassword(email) {
  const response = await apiClient.post('/forgot-password', { email })
  return response.data
}

export async function verifyOtp({ email, otp }) {
  const response = await apiClient.post('/verify-otp', { email, otp })
  return response.data
}

export async function resetPassword({ reset_token, password, password_confirmation }) {
  const response = await apiClient.post('/reset-password', {
    reset_token,
    password,
    password_confirmation,
  })
  return response.data
}
