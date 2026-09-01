import type { PropsWithChildren } from 'react'

import { Button, Spinner } from '@/shared/ui'

import { useSessionProvider } from './model/use-session-provider'

export function SessionProvider({ children }: PropsWithChildren) {
  const { isError, isPending, isRetrying, retryGuestSession } =
    useSessionProvider()

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8" aria-label="사용자 세션 준비 중" />
      </main>
    )
  }

  if (isError) {
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
            disabled={isRetrying}
            onClick={retryGuestSession}
          >
            {isRetrying ? '재시도 중...' : '다시 시도'}
          </Button>
        </section>
      </main>
    )
  }

  return children
}
