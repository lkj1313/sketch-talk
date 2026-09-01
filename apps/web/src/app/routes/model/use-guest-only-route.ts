import { useSessionStore } from '@/entities/session'

export function useGuestOnlyRoute() {
  const user = useSessionStore((state) => state.user)

  return {
    isAuthenticated: Boolean(user),
  }
}
