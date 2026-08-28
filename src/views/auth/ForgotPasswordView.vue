<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { forgotPassword, verifyOtp, resetPassword } from '@/api/auth'
import { toast } from 'vue3-toastify'
import OtpInput from '@/components/common/OtpInput.vue'

const router = useRouter()

const step = ref(1)
const email = ref('')
const otp = ref('')
const resetToken = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const errorMessage = ref('')

const RESEND_COOLDOWN = 60
const cooldown = ref(0)
let cooldownInterval = null

const passwordsMatch = computed(() => password.value === passwordConfirmation.value)
const passwordValid = computed(() => password.value.length >= 8)

function startCooldown() {
  if (cooldownInterval) clearInterval(cooldownInterval)
  cooldown.value = RESEND_COOLDOWN
  cooldownInterval = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})

async function handleRequestOtp() {
  errorMessage.value = ''
  if (!email.value.trim()) {
    errorMessage.value = 'Please enter your email address.'
    return
  }

  loading.value = true
  try {
    await forgotPassword(email.value.trim())
    step.value = 2
    startCooldown()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'Unable to send code. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleVerifyOtp() {
  errorMessage.value = ''
  if (otp.value.length !== 6) {
    errorMessage.value = 'Please enter the complete 6-digit code.'
    return
  }

  loading.value = true
  try {
    const result = await verifyOtp({ email: email.value.trim(), otp: otp.value })
    resetToken.value = result.reset_token
    step.value = 3
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'Invalid code. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleResetPassword() {
  errorMessage.value = ''

  if (!passwordValid.value) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }
  if (!passwordsMatch.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await resetPassword({
      reset_token: resetToken.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    toast.success('Password reset successfully')
    router.push({ name: 'login' })
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'Unable to reset password. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  if (cooldown.value > 0) return
  errorMessage.value = ''
  loading.value = true
  try {
    await forgotPassword(email.value.trim())
    startCooldown()
    toast.success('A new code has been sent to your email.')
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'Unable to resend code. Please try again.'
  } finally {
    loading.value = false
  }
}

const stepTitles = {
  1: 'Reset your password',
  2: 'Enter verification code',
  3: 'Set new password',
}

const stepSubtitles = {
  1: "Enter your email and we'll send you a verification code.",
  2: `We've sent a 6-digit code to`,
  3: 'Create a new password for your account.',
}
</script>

<template>
  <div class="bg-secondary-50 flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-secondary-900 text-2xl font-bold">{{ stepTitles[step] }}</h1>
        <p class="text-secondary-500 mt-2 text-sm">
          {{ stepSubtitles[step] }}
          <span v-if="step === 2" class="text-secondary-700 font-medium">{{ email }}</span>
        </p>
      </div>

      <div class="ring-secondary-200 rounded-xl bg-white p-8 shadow-sm ring-1">
        <div
          v-if="errorMessage"
          class="bg-danger-50 text-danger-700 mb-6 rounded-lg px-4 py-3 text-sm font-medium"
          role="alert"
        >
          {{ errorMessage }}
        </div>

        <form class="space-y-5" @submit.prevent="step === 1 ? handleRequestOtp() : step === 2 ? handleVerifyOtp() : handleResetPassword()">
          <div v-if="step === 1">
            <label for="email" class="text-secondary-700 mb-1.5 block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
              :disabled="loading"
            />
          </div>

          <div v-if="step === 2" class="flex flex-col items-center gap-4">
            <OtpInput v-model="otp" :length="6" :disabled="loading" />
          </div>

          <div v-if="step === 3" class="space-y-4">
            <div>
              <label for="password" class="text-secondary-700 mb-1.5 block text-sm font-medium">
                New password
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                :disabled="loading"
              />
            </div>
            <div>
              <label for="password-confirmation" class="text-secondary-700 mb-1.5 block text-sm font-medium">
                Confirm password
              </label>
              <input
                id="password-confirmation"
                v-model="passwordConfirmation"
                type="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                :disabled="loading"
              />
            </div>
          </div>

          <button
            type="submit"
            class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 disabled:bg-primary-400 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <template v-if="loading">Processing…</template>
            <template v-else-if="step === 1">Send code</template>
            <template v-else-if="step === 2">Verify code</template>
            <template v-else>Reset password</template>
          </button>
        </form>

        <div v-if="step === 2" class="mt-4 text-center">
          <button
            type="button"
            class="text-primary-600 hover:text-primary-500 text-sm font-medium disabled:text-secondary-400"
            :disabled="cooldown > 0 || loading"
            @click="handleResend"
          >
            <template v-if="cooldown > 0">Resend code in {{ cooldown }}s</template>
            <template v-else>Resend code</template>
          </button>
        </div>

        <div class="mt-6 text-center">
          <router-link
            :to="{ name: 'login' }"
            class="text-secondary-500 hover:text-secondary-700 text-sm font-medium"
          >
            Back to sign in
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
