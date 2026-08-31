import { useQuery } from '@tanstack/react-query'

import { useSessionStore } from '@/entities/session'

import { getMe } from '../api/get-me'
import { refreshSession } from '../api/refresh-session'

const RESTORE_SESSION_QUERY_KEY = ['auth', 'restore-session'] as const

async function restoreSession(): Promise<boolean> {
  try {
    const { accessToken } = await refreshSession()
    const user = await getMe(accessToken)

    useSessionStore.getState().setSession(accessToken, user)

    return true
  } catch {
    useSessionStore.getState().clearSession()

    return false
  }
}

export function useRestoreSession() {
  return useQuery({
    queryKey: RESTORE_SESSION_QUERY_KEY,
    queryFn: restoreSession,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })
}
