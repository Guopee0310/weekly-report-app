import { defineStore } from 'pinia'

interface AuthState {
  displayName: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    displayName: import.meta.client ? localStorage.getItem('weekly-report-user') : null,
  }),
  getters: {
    isLoggedIn: (state): boolean => state.displayName !== null,
  },
  actions: {
    login(name: string): void {
      this.displayName = name
      if (import.meta.client) localStorage.setItem('weekly-report-user', name)
    },
    logout(): void {
      this.displayName = null
      if (import.meta.client) localStorage.removeItem('weekly-report-user')
    },
  },
})
