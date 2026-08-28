<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Please enter your email and password.'
    return
  }

  loading.value = true
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'Unable to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-secondary-50 flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-secondary-900 text-2xl font-bold">Restaurant Management System</h1>
        <p class="text-secondary-500 mt-2 text-sm">Sign in to your account to continue</p>
      </div>

      <div class="ring-secondary-200 rounded-xl bg-white p-8 shadow-sm ring-1">
        <div
          v-if="errorMessage"
          class="bg-danger-50 text-danger-700 mb-6 rounded-lg px-4 py-3 text-sm font-medium"
          role="alert"
        >
          {{ errorMessage }}
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
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

          <div>
            <label for="password" class="text-secondary-700 mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-100 disabled:bg-secondary-50 block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
              :disabled="loading"
            />
            <div class="mt-2 text-right">
              <router-link
                :to="{ name: 'forgot-password' }"
                class="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Forgot password?
              </router-link>
            </div>
          </div>

          <button
            type="submit"
            class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 disabled:bg-primary-400 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
            :disabled="loading"
          >
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
