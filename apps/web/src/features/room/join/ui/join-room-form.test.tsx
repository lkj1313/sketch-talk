import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session'

import { JoinRoomForm } from './join-room-form'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  useJoinRoom: vi.fn(),
}))

vi.mock('../model/use-join-room', () => ({
  useJoinRoom: mocks.useJoinRoom,
}))

describe('JoinRoomForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSessionStore.getState().clearSession()
    mocks.useJoinRoom.mockReturnValue({
      mutate: mocks.mutate,
      isPending: false,
    })
  })

  it('비회원에게 닉네임을 입력받는다', () => {
    render(<JoinRoomForm code="ABC234" />)

    expect(screen.getByLabelText('닉네임')).toBeInTheDocument()
  })

  it('비회원 닉네임을 검증한다', async () => {
    const user = userEvent.setup()
    render(<JoinRoomForm code="ABC234" />)

    await user.click(screen.getByRole('button', { name: '참가하기' }))

    expect(
      await screen.findByText('닉네임은 2자 이상이어야 합니다.'),
    ).toBeInTheDocument()
    expect(mocks.mutate).not.toHaveBeenCalled()
  })

  it('비회원 닉네임으로 방 참가를 요청한다', async () => {
    const user = userEvent.setup()
    render(<JoinRoomForm code="ABC234" />)

    await user.type(screen.getByLabelText('닉네임'), '게스트님')
    await user.click(screen.getByRole('button', { name: '참가하기' }))

    await waitFor(() => {
      expect(mocks.mutate).toHaveBeenCalledWith(
        { nickname: '게스트님' },
        expect.any(Object),
      )
    })
  })

  it('회원은 닉네임 없이 방 참가를 요청한다', async () => {
    const user = userEvent.setup()
    useSessionStore.getState().setSession('access-token', {
      id: 'user-id',
      email: 'member@example.com',
      nickname: '회원님',
      avatarUrl: null,
      createdAt: '2026-08-26T00:00:00.000Z',
    })
    render(<JoinRoomForm code="ABC234" />)

    expect(screen.queryByLabelText('닉네임')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '참가하기' }))

    await waitFor(() => {
      expect(mocks.mutate).toHaveBeenCalledWith({}, expect.any(Object))
    })
  })
})
