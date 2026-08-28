import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/api/client', () => ({
  default: { post: vi.fn() },
}))

import apiClient from '@/api/client'
import { forgotPassword, verifyOtp, resetPassword } from '@/api/auth'

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('forgotPassword', () => {
    it('sends POST /forgot-password with email and returns data', async () => {
      const payload = { message: 'OTP sent' }
      apiClient.post.mockResolvedValueOnce({ data: payload })

      const result = await forgotPassword('user@example.com')

      expect(apiClient.post).toHaveBeenCalledWith('/forgot-password', { email: 'user@example.com' })
      expect(result).toEqual(payload)
    })
  })

  describe('verifyOtp', () => {
    it('sends POST /verify-otp with email and otp and returns data including reset_token', async () => {
      const payload = { message: 'OTP verified', reset_token: 'abc123' }
      apiClient.post.mockResolvedValueOnce({ data: payload })

      const result = await verifyOtp({ email: 'user@example.com', otp: '123456' })

      expect(apiClient.post).toHaveBeenCalledWith('/verify-otp', {
        email: 'user@example.com',
        otp: '123456',
      })
      expect(result).toEqual(payload)
    })
  })

  describe('resetPassword', () => {
    it('sends POST /reset-password with reset_token, password, and password_confirmation', async () => {
      const payload = { message: 'Password reset successfully' }
      apiClient.post.mockResolvedValueOnce({ data: payload })

      const result = await resetPassword({
        reset_token: 'abc123',
        password: 'newpassword1',
        password_confirmation: 'newpassword1',
      })

      expect(apiClient.post).toHaveBeenCalledWith('/reset-password', {
        reset_token: 'abc123',
        password: 'newpassword1',
        password_confirmation: 'newpassword1',
      })
      expect(result).toEqual(payload)
    })
  })
})
