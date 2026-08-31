import type { AuthUser } from '@sketch-talk/contracts'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session'

import { SessionProvider } from './session-provider'

const mocks = vi.hoisted(() => ({
  setupAuthInterceptors: vi.fn(() => vi.fn()),
  useRestoreSession: vi.fn(),
  useGuestSession: vi.fn(),
  refetchGuestSession: vi.fn(),
}))

vi.mock('@/features/auth-session', () => ({
  setupAuthInterceptors: mocks.setupAuthInterceptors,
  useRestoreSession: mocks.useRestoreSession,
}))

vi.mock('@/features/guest-session', () => ({
  useGuestSession: mocks.useGuestSession,
}))

const user: AuthUser = {
  id: 'user-id',
  email: 'test@example.com',
  nickname: '테스터',
  avatarUrl: null,
  createdAt: '2026-08-26T00:00:00.000Z',
}

function mockGuestSessionQuery(
  state: Partial<{
    isPending: boolean
    isError: boolean
    isFetching: boolean
  }> = {},
): void {
  mocks.useGuestSession.mockReturnValue({
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: mocks.refetchGuestSession,
    ...state,
  })
}

describe('SessionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSessionStore.getState().clearSession()
    mocks.useRestoreSession.mockReturnValue({ isPending: false })
    mockGuestSessionQuery()
  })

  it('회원 세션을 복원하는 동안 로딩 상태를 표시한다', () => {
    mocks.useRestoreSession.mockReturnValue({ isPending: true })

    render(
      <SessionProvider>
        <h1>애플리케이션</h1>
      </SessionProvider>,
    )

    expect(
      screen.getByRole('status', { name: '사용자 세션 준비 중' }),
    ).toBeInTheDocument()
    expect(mocks.useGuestSession).toHaveBeenCalledWith(false)
  })

  it('로그인 사용자는 비회원 세션을 발급하지 않는다', () => {
    useSessionStore.getState().setSession('access-token', user)

    render(
      <SessionProvider>
        <h1>애플리케이션</h1>
      </SessionProvider>,
    )

    expect(
      screen.getByRole('heading', { name: '애플리케이션' }),
    ).toBeInTheDocument()
    expect(mocks.useGuestSession).toHaveBeenCalledWith(false)
  })

  it('비로그인 사용자의 비회원 세션을 준비한다', () => {
    mockGuestSessionQuery({ isPending: true })

    render(
      <SessionProvider>
        <h1>애플리케이션</h1>
      </SessionProvider>,
    )

    expect(
      screen.getByRole('status', { name: '사용자 세션 준비 중' }),
    ).toBeInTheDocument()
    expect(mocks.useGuestSession).toHaveBeenCalledWith(true)
  })

  it('비회원 세션 준비에 실패하면 재시도할 수 있다', () => {
    mockGuestSessionQuery({ isError: true })

    render(
      <SessionProvider>
        <h1>애플리케이션</h1>
      </SessionProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(
      screen.getByRole('heading', {
        name: '세션을 준비하지 못했습니다.',
      }),
    ).toBeInTheDocument()
    expect(mocks.refetchGuestSession).toHaveBeenCalledOnce()
  })
})
