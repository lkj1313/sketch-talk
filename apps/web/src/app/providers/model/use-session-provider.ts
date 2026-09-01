import { useEffect } from 'react'

import { useSessionStore } from '@/entities/session'
import {
  setupAuthInterceptors,
  useRestoreSession,
} from '@/features/auth-session'
import { useGuestSession } from '@/features/guest-session'

export function useSessionProvider() {
  const accessToken = useSessionStore((state) => state.accessToken)
  const { isPending: isSessionRestorePending } = useRestoreSession()
  const shouldIssueGuestSession = !isSessionRestorePending && !accessToken
  const guestSessionQuery = useGuestSession(shouldIssueGuestSession)

  useEffect(() => setupAuthInterceptors(), [])

  function retryGuestSession(): void {
    void guestSessionQuery.refetch()
  }

  return {
    isError: shouldIssueGuestSession && guestSessionQuery.isError,
    isPending:
      isSessionRestorePending ||
      (shouldIssueGuestSession && guestSessionQuery.isPending),
    isRetrying: guestSessionQuery.isFetching,
    retryGuestSession,
  }
}
