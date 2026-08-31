import { useEffect, type PropsWithChildren } from 'react'

import {
  setupAuthInterceptors,
  useRestoreSession,
} from '@/features/auth-session'
import { useSessionStore } from '@/entities/session'
import { useGuestSession } from '@/features/guest-session'
import { Button, Spinner } from '@/shared/ui'

export function SessionProvider({ children }: PropsWithChildren) {
  const accessToken = useSessionStore((state) => state.accessToken)
  const { isPending: isSessionRestorePending } = useRestoreSession()
  const shouldIssueGuestSession = !isSessionRestorePending && !accessToken
  const guestSessionQuery = useGuestSession(shouldIssueGuestSession)

  useEffect(() => setupAuthInterceptors(), [])

  if (
    isSessionRestorePending ||
    (shouldIssueGuestSession && guestSessionQuery.isPending)
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8" aria-label="사용자 세션 준비 중" />
      </main>
    )
  }

  if (shouldIssueGuestSession && guestSessionQuery.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <section className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">세션을 준비하지 못했습니다.</h1>
            <p className="text-sm text-muted-foreground">
              네트워크 연결을 확인한 후 다시 시도해주세요.
            </p>
          </div>
          <Button
            type="button"
            disabled={guestSessionQuery.isFetching}
            onClick={() => void guestSessionQuery.refetch()}
          >
            {guestSessionQuery.isFetching ? '재시도 중...' : '다시 시도'}
          </Button>
        </section>
      </main>
    )
  }

  return children
}
