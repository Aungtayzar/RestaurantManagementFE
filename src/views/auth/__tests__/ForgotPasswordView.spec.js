import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/api/auth', () => ({
  forgotPassword: vi.fn(),
  verifyOtp: vi.fn(),
  resetPassword: vi.fn(),
}))
vi.mock('vue3-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { forgotPassword, verifyOtp, resetPassword } from '@/api/auth'
import { toast } from 'vue3-toastify'
import ForgotPasswordView from '../ForgotPasswordView.vue'

function createRouterWith(view) {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: view },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    ],
  })
}

describe('ForgotPasswordView', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  async function mountView() {
    const router = createRouterWith(ForgotPasswordView)
    router.push('/')
    await router.isReady()

    wrapper = mount(ForgotPasswordView, {
      global: { plugins: [router] },
    })
    await flushPromises()
    return { router }
  }

  describe('Step 1: Request OTP', () => {
    it('shows email input and submit button', async () => {
      await mountView()

      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('button').text()).toContain('Send code')
    })

    it('calls forgotPassword API and advances to step 2 on success', async () => {
      forgotPassword.mockResolvedValueOnce({ message: 'OTP sent' })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(forgotPassword).toHaveBeenCalledWith('user@example.com')
      expect(wrapper.text()).toContain('Enter verification code')
    })

    it('shows error message on API failure', async () => {
      forgotPassword.mockRejectedValueOnce({
        response: { data: { message: 'No account found with this email' } },
      })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('No account found with this email')
    })

    it('validates email is required', async () => {
      await mountView()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(forgotPassword).not.toHaveBeenCalled()
    })
  })

  describe('Step 2: Verify OTP', () => {
    it('shows OTP input and resend button', async () => {
      forgotPassword.mockResolvedValueOnce({ message: 'OTP sent' })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.findAll('input[inputmode="numeric"]')).toHaveLength(6)
      expect(wrapper.text()).toContain('Resend code')
    })

    it('calls verifyOtp API and advances to step 3 on success', async () => {
      forgotPassword.mockResolvedValueOnce({ message: 'OTP sent' })
      verifyOtp.mockResolvedValueOnce({ message: 'OTP verified', reset_token: 'abc123' })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const otpInputs = wrapper.findAll('input[inputmode="numeric"]')
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].setValue(String(i + 1))
      }
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(verifyOtp).toHaveBeenCalledWith({ email: 'user@example.com', otp: '123456' })
      expect(wrapper.text()).toContain('Set new password')
    })

    it('shows error on invalid OTP', async () => {
      forgotPassword.mockResolvedValueOnce({ message: 'OTP sent' })
      verifyOtp.mockRejectedValueOnce({
        response: { data: { message: 'Invalid OTP' } },
      })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const otpInputs = wrapper.findAll('input[inputmode="numeric"]')
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].setValue(String(i + 1))
      }
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('Invalid OTP')
    })

    it('resends OTP when clicking resend link', async () => {
      forgotPassword.mockResolvedValue({ message: 'OTP sent' })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      vi.advanceTimersByTime(61000)
      await flushPromises()

      const resendButton = wrapper.findAll('button').find((b) => b.text().includes('Resend'))
      await resendButton.trigger('click')
      await flushPromises()

      expect(forgotPassword).toHaveBeenCalledTimes(2)
    })
  })

  describe('Step 3: Reset Password', () => {
    it('shows password and confirmation fields', async () => {
      forgotPassword.mockResolvedValueOnce({ message: 'OTP sent' })
      verifyOtp.mockResolvedValueOnce({ message: 'verified', reset_token: 'abc123' })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const otpInputs = wrapper.findAll('input[inputmode="numeric"]')
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].setValue(String(i + 1))
      }
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.findAll('input[type="password"]')).toHaveLength(2)
      expect(wrapper.find('button').text()).toContain('Reset password')
    })

    it('calls resetPassword API and shows success on valid passwords', async () => {
      forgotPassword.mockResolvedValueOnce({ message: 'OTP sent' })
      verifyOtp.mockResolvedValueOnce({ message: 'verified', reset_token: 'abc123' })
      resetPassword.mockResolvedValueOnce({ message: 'Password reset successfully' })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const otpInputs = wrapper.findAll('input[inputmode="numeric"]')
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].setValue(String(i + 1))
      }
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const passwordInputs = wrapper.findAll('input[type="password"]')
      await passwordInputs[0].setValue('newpassword1')
      await passwordInputs[1].setValue('newpassword1')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(resetPassword).toHaveBeenCalledWith({
        reset_token: 'abc123',
        password: 'newpassword1',
        password_confirmation: 'newpassword1',
      })
      expect(toast.success).toHaveBeenCalledWith('Password reset successfully')
    })

    it('validates passwords match', async () => {
      forgotPassword.mockResolvedValueOnce({ message: 'OTP sent' })
      verifyOtp.mockResolvedValueOnce({ message: 'verified', reset_token: 'abc123' })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const otpInputs = wrapper.findAll('input[inputmode="numeric"]')
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].setValue(String(i + 1))
      }
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const passwordInputs = wrapper.findAll('input[type="password"]')
      await passwordInputs[0].setValue('newpassword1')
      await passwordInputs[1].setValue('different')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('Passwords do not match')
      expect(resetPassword).not.toHaveBeenCalled()
    })

    it('validates minimum password length', async () => {
      forgotPassword.mockResolvedValueOnce({ message: 'OTP sent' })
      verifyOtp.mockResolvedValueOnce({ message: 'verified', reset_token: 'abc123' })
      await mountView()

      await wrapper.find('input[type="email"]').setValue('user@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const otpInputs = wrapper.findAll('input[inputmode="numeric"]')
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].setValue(String(i + 1))
      }
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const passwordInputs = wrapper.findAll('input[type="password"]')
      await passwordInputs[0].setValue('short')
      await passwordInputs[1].setValue('short')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('Password must be at least 8 characters')
      expect(resetPassword).not.toHaveBeenCalled()
    })
  })
})
