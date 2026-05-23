import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      doctor: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (doctor, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
        }
        set({ doctor, accessToken, refreshToken, isAuthenticated: true })
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
        set({ doctor: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      updateDoctor: (doctor) => set({ doctor }),
    }),
    {
      name: 'jeevaai-auth',
      partialize: s => ({ doctor: s.doctor, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    }
  )
)
