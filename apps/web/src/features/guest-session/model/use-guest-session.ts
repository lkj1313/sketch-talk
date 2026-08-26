import { useQuery } from '@tanstack/react-query'

import { issueGuestSession } from '../api/issue-guest-session'

const GUEST_SESSION_QUERY_KEY = ['guest-session'] as const
const GUEST_SESSION_REFRESH_INTERVAL_MS = 60 * 60 * 1_000

export function useGuestSession(enabled: boolean) {
  return useQuery({
    queryKey: GUEST_SESSION_QUERY_KEY,
    queryFn: issueGuestSession,
    enabled,
    retry: false,
    staleTime: GUEST_SESSION_REFRESH_INTERVAL_MS,
    refetchInterval: GUEST_SESSION_REFRESH_INTERVAL_MS,
  })
}
