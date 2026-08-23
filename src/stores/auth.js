import { defineStore } from 'pinia'
import * as authService from '@/api/auth'
import { TOKEN_STORAGE_KEY } from '@/api/client'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem(TOKEN_STORAGE_KEY),
  }),
  actions: {
    async login(credentials) {
      const data = await authService.login(credentials)
      this.token = data.token
      this.user = data.user ?? null
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      return data
    },
    async logout() {
      await authService.logout().catch(() => {})
      this.user = null
      this.token = null
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    },
  },
})
