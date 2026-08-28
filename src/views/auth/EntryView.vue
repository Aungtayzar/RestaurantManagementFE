<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="bg-secondary-50 flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md text-center">
      <div class="mb-8">
        <h1 class="text-secondary-900 text-2xl font-bold">Restaurant Management System</h1>
        <p class="text-secondary-500 mt-2 text-sm">
          Sign in to manage orders, the kitchen, and reports.
        </p>
      </div>

      <div class="ring-secondary-200 rounded-xl bg-white p-8 shadow-sm ring-1">
        <h2 class="text-secondary-900 text-lg font-semibold">Welcome</h2>
        <p class="text-secondary-500 mt-1 text-sm">Use the button below to access your account.</p>

        <RouterLink
          :to="{ name: 'login' }"
          class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-200 mt-6 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors focus:ring-2 focus:outline-none"
        >
          Sign in
        </RouterLink>

        <div class="mt-4 text-center">
          <RouterLink
            :to="{ name: 'forgot-password' }"
            class="text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            Forgot password?
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
