import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string | null
}

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
}

interface AuthState {
  user: User | null
  tenant: Tenant | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (data: {
    user: User
    tenant: Tenant
    accessToken: string
    refreshToken: string
  }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: ({ user, tenant, accessToken, refreshToken }) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, tenant, accessToken, refreshToken, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    { name: 'auth-storage' }
  )
)
