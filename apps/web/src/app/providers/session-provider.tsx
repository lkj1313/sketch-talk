import { useEffect, type PropsWithChildren } from 'react'

import {
  setupAuthInterceptors,
  useRestoreSession,
} from '@/features/auth/session'
import { Spinner } from '@/shared/ui'

export function SessionProvider({ children }: PropsWithChildren) {
  const { isPending } = useRestoreSession()

  useEffect(() => setupAuthInterceptors(), [])

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8" aria-label="로그인 상태 확인 중" />
      </main>
    )
  }

  return children
}
