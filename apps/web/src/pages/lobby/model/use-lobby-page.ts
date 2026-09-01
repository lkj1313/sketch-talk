import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session'

export function useLobbyPage() {
  const navigate = useNavigate()
  const accessToken = useSessionStore((state) => state.accessToken)

  function goToLogin(): void {
    void navigate('/login')
  }

  return {
    goToLogin,
    isAuthenticated: Boolean(accessToken),
  }
}
