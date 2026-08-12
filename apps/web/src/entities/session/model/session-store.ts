import type { AuthUser } from '@sketch-talk/contracts'
import { create } from 'zustand'

type SessionState = {
  accessToken: string | null
  user: AuthUser | null
  setSession: (accessToken: string, user: AuthUser) => void
  setAccessToken: (accessToken: string) => void
  setUser: (user: AuthUser) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  user: null,

  setSession: (accessToken, user) => {
    set({ accessToken, user })
  },

  setAccessToken: (accessToken) => {
    set({ accessToken })
  },

  setUser: (user) => {
    set({ user })
  },

  clearSession: () => {
    set({ accessToken: null, user: null })
  },
}))
