import { defineStore } from 'pinia'
import * as authService from '@/api/auth'
import { TOKEN_STORAGE_KEY } from '@/api/client'

export const USER_STORAGE_KEY = 'auth_user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) ?? null
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStoredUser(),
    token: localStorage.getItem(TOKEN_STORAGE_KEY),
  }),
  actions: {
    async login(credentials) {
      const data = await authService.login(credentials)
      this.token = data.token
      this.user = data.user ?? null
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      if (this.user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user))
      } else {
        localStorage.removeItem(USER_STORAGE_KEY)
      }
      return data
    },
    async logout() {
      await authService.logout().catch(() => {})
      this.user = null
      this.token = null
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    },
  },
})
